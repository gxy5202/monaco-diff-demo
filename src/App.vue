<template>
	<div id="monaco"></div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import * as monaco from 'monaco-editor';

import deepDiff from 'deep-diff';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
	getWorker(_, label) {
		if (label === 'json') {
			return new jsonWorker()
		}
		if (label === 'css' || label === 'scss' || label === 'less') {
			return new cssWorker()
		}
		if (label === 'html' || label === 'handlebars' || label === 'razor') {
			return new htmlWorker()
		}
		if (label === 'typescript' || label === 'javascript') {
			return new tsWorker()
		}
		return new editorWorker()
	}
}

const contentRef = ref('');
onMounted(() => {
	const originJson = {
		b: {
			x: {
				sss: 123
			}
		},
		a: 1,
		code: 0,
		x: {
			time: {
				a: 2
			}
		}
	};
	const newJson = {
		a: 1,
		b: {
			property: {
				xxx: 123
			}
		},
		code: 1,
		x: {
			time: {
				b: 2
			}
		}
	};

	const xmlData = '<span><a>1</a></span>'

	function formatXML(xml) {
		let formatted = '';
		const reg = /(>)(<)(\/*)/g;
		xml = xml.replace(reg, '$1\r\n$2$3');
		let pad = 0;

		xml.split('\r\n').forEach(node => {
			let indent = 0;
			if (node.match(/.+<\/\w[^>]*>$/)) {
				indent = 0;
			} else if (node.match(/^<\/\w/)) {
				if (pad != 0) {
					pad -= 1;
				}
			} else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
				indent = 1;
			} else {
				indent = 0;
			}

			const padding = '  '.repeat(pad);
			formatted += padding + node + '\r\n';
			pad += indent;
		});

		return formatted;
	}

	// const editor = monaco.createDiffEditor(contentRef, originJson);

	const editor = monaco.editor.create(document.getElementById("monaco"), {
		value: JSON.stringify(newJson, null, 4),
		minimap: {
			enabled: false
		},
		wordWrap: 'true',
		codeLens: false,
		disableLayerHinting: true,
		automaticLayout: true,
		language: "html",
		readOnly: true
	});

	window.editor = editor;

	setTimeout(() => {
		editor.getAction('editor.action.formatDocument')?._run();
	})


	// 比较两个对象的差异，并标记出差异所在的行号
	// 比较两个 JSON 对象的差异，并在 Monaco Editor 中标记有差异的行
	function markDiffInEditor(editor, objA, objB) {

		// 比较两个 JSON 字符串的差异
		const differences = deepDiff(objA, objB);

		const data = markKeyLines(objB);

		function getColumnCount() {
			const model = editor.getModel();
			const lineCount = model.getLineCount();
			const columnCounts = [];

			for (let i = 1; i <= lineCount; i++) {
				const lineContent = model.getLineContent(i);
				const columnCount = lineContent.length;
				columnCounts.push(columnCount);
			}

			return columnCounts;
		}

		const counts = getColumnCount();

		if (differences) {
			differences.forEach(diff => {
				// 缺少的
				if (diff.kind === 'D') {
					const { path } = diff;
					const key = path[path.length >= 2 ? path.length - 2 : path.length - 1];
					const needKey = path.at(-1);

					const target = data[key];
					if (target) {
						contentRef.value += `${contentRef.value} \n 属性${key}缺少配置${needKey}`

						const dom = document.createElement('div');
						dom.setAttribute('id', `domWidget-${key}`);
						dom.classList.add('domWidget');
						dom.innerHTML = contentRef.value;
						document.body.appendChild(dom);
						editor.addContentWidget({
							domNode: dom,
							getId: function () { return `domWidget-${key}`; },
							getDomNode: function () { return this.domNode; },
							getPosition: function () {
								const editorLayout = editor.getLayoutInfo();
								const left = (editorLayout.contentWidth - this.domNode.getBoundingClientRect().width - 20) + 'px';

								const top = editor.getTopForLineNumber(target.startLine);
                    			const bottom = editor.getTopForLineNumber(target.startLine + target.lineCount);
								setTimeout(() => {
									this.domNode.style.left = left;
									this.domNode.style.height = (bottom - top) + 'px';
								}, 500)
								return {
									position: { lineNumber: target.startLine, column: 1 },
									preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
								}
							}
						});
						editor.createDecorationsCollection([{
							range: new monaco.Range(target.startLine, 1, target.startLine + target.lineCount, 1),
							options: {
								isWholeLine: true,
								className: 'line-highlight',
								// after: {
								// 	content: ' ',
								// 	inlineClassName: 'fudong'
								// }
							}
						}]);

						// editor.createDecorationsCollection([{
						// 	range: new monaco.Range(target.startLine, 1, target.startLine + target.lineCount, 1),
						// 	options: {
						// 		isWholeLine: false,
						// 		className: 'h-highlight',
						// 	}
						// }]);
					}
				}
			});
		}
	}

	function setLineInfo(jsonObj, lines, keyLineInfo) {
		Object.keys(jsonObj).forEach(key => {
			const keyPattern = `"${key}":`;
			const startIndex = lines.findIndex(line => line.includes(keyPattern));

			if (startIndex !== -1) {
				const endIndex = startIndex + lines[startIndex].split('\n').length;
				keyLineInfo[key] = {
					startLine: startIndex + 1, // 行号从1开始
					lineCount: endIndex + 1
				};

				if (Object.prototype.toString.call(jsonObj[key]) === "[object Object]") {
					// 如果是对象递归
					setLineInfo(jsonObj[key], lines, keyLineInfo);
				}
			}
		});
	}


	// 获取值所占行数的函数
	function markKeyLines(jsonObj) {
		const model = editor.getModel();
		const lines = model.getLinesContent();
		const keyLineInfo = {};

		setLineInfo(jsonObj, lines, keyLineInfo);
		return keyLineInfo;
	}

	markDiffInEditor(editor, originJson, newJson)

})

</script>
<style scoped>
#monaco {
	width: 100%;
	height: 100%;
}

.fudong {
	width: 1px;
	height: 30px;
	background-color: green;
}
.domWidget {
	width: 200px;
	height: 300px;
	background-color: antiquewhite;
}
</style>
