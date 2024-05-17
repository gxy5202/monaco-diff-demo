import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

const monaco = ((monacoEditorPlugin as any).default) as Function;
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), monaco({
      languageWorkers: ['json']
  })],
})
