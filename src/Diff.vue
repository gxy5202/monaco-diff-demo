<template>
    <div id="monaco"></div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import * as monaco from 'monaco-editor';
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

    const originJava = `
    // sss
    public class HelloWorlds {
        public static void main(String[] args) {
            System.out.println("Hello, World");
        }
    }
`;
    const newJava = `
    public class HelloWorld {
        public static void main(String[] args) {
            System.out.println("Hellos, World");
        }
    }
`

    monaco.editor.defineTheme('myCustomTheme', {
        base: 'vs', // 可以是 'vs', 'vs-dark', 'hc-black'
        inherit: true, // 是否继承基本主题
        rules: [
            { token: 'addition', background: '#00FF00' }, // 新增的文本样式
            { token: 'deletion', background: '#FF0000' }, // 删除的文本样式
            { token: 'change', background: '#0000FF' }   // 变更的文本样式
        ] , // 语法规则，这里可以为空
        colors: {
            'editor.background': '#FFFFFF',
            'editor.foreground': '#000000',
            "diffEditor.insertedTextBackground": "#00ff007c",
		"diffEditor.removedTextBackground": "#ff00007c",

		"diffEditor.insertedLineBackground": "#22336866",
		"diffEditor.removedLineBackground": "#72336a66",

		"diffEditorGutter.insertedLineBackground": "#223368ff",
		"diffEditorGutter.removedLineBackground": "#72336aff",

		"diffEditorOverview.insertedForeground": "#02b40b",
		"diffEditorOverview.removedForeground": "#a10000"
        }
    });
    monaco.editor.setTheme('myCustomTheme');

    const diffEditor = monaco.editor.createDiffEditor(document.getElementById("monaco"), {
        // colorDecorators: true,
        // compactMode: true,
        diffAlgorithm: 'advanced',
        // experimental: {
        //     showEmptyDecorations: true,
        //     showMoves: true,
        //     useTrueInlineView: true
        // }
    });

    diffEditor.setModel({
        original: monaco.editor.createModel(originJava, 'java'),
        modified: monaco.editor.createModel(newJava, 'java')
    });
    // const editor = monaco.editor.create(document.getElementById("monaco"), {
    // 	value: JSON.stringify(newJson, null, 4),
    // 	minimap: {
    // 		enabled: false
    // 	},
    // 	wordWrap: 'true',
    // 	codeLens: false,
    // 	disableLayerHinting: true,
    // 	automaticLayout: true,
    // 	language: "html",
    // 	readOnly: true
    // });

    window.editor = diffEditor;

    setTimeout(() => {
        diffEditor.getAction('editor.action.formatDocument')?._run();
    })
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
