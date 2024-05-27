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
		language: "json",
		readOnly: true
	});

	window.editor = editor;

	setTimeout(() => {
		editor.getAction('editor.action.formatDocument')?.run();
	},)


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
								const left = (editorLayout.contentWidth - this.domNode.getBoundingClientRect().width - 20);
								console.log(left);
								// setTimeout(() => {
								// 	this.domNode.style.left = left;
								// })
								return {
									position: { lineNumber: target.startLine },
									preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
									offsetX: left
								}
							}
						});
						editor.createDecorationsCollection([{
							range: new monaco.Range(target.startLine, 1, target.startLine + target.lineCount, 1),
							options: {
								isWholeLine: true,
								className: 'line-highlight',
								before: {
									content: `属性${key}缺少配置${needKey}`,
									inlineClassName: 'fudong'
								}
							}
						}]);
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

.domWidget {
	width: 200px;
	height: 300px;
	background-color: antiquewhite;
}
</style>
