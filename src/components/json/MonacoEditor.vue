<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useAppStore } from '@/stores/app'

const props = withDefaults(defineProps<{
  modelValue?: string
  language?: string
  readonly?: boolean
}>(), {
  modelValue: '',
  language: 'json',
  readonly: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'editorReady', editor: any): void
  (e: 'cursorChange', position: { lineNumber: number; column: number }): void
}>()

const appStore = useAppStore()

const editorContainer = ref<HTMLDivElement>()
let editor: any = null
let monaco: any = null

const editorTheme = computed(() => appStore.isDark ? 'vs-dark' : 'vs')

async function initMonaco() {
  const monacoLoader = await import('monaco-editor')
  monaco = monacoLoader

  monaco.languages.registerCompletionItemProvider('json', {
    provideCompletionItems: () => {
      const suggestions = [
        ...['true', 'false', 'null'].map(v => ({
          label: v,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: v,
        })),
        {
          label: '{} - 空对象',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '{\n  $1\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        },
        {
          label: '[] - 空数组',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '[\n  $1\n]',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        },
      ]
      return { suggestions }
    },
  })

  if (!editorContainer.value) return

  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language,
    theme: editorTheme.value,
    readOnly: props.readonly,
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineNumbers: 'on',
    minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'off',
    bracketPairColorization: { enabled: true },
    matchBrackets: 'always',
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    folding: true,
    foldingHighlight: true,
    renderWhitespace: 'selection',
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    padding: { top: 12, bottom: 12 },
    fixedOverflowWidgets: true,
    'semanticHighlighting.enabled': true,
  })

  editor.onDidChangeModelContent(() => {
    const value = editor.getValue()
    emit('update:modelValue', value)
  })

  editor.onDidChangeCursorPosition((e: any) => {
    emit('cursorChange', {
      lineNumber: e.position.lineNumber,
      column: e.position.column,
    })
  })

  emit('editorReady', { editor, monaco })

  editor.focus()
}

// Only update editor from external changes
watch(() => props.modelValue, (newVal) => {
  if (editor && newVal !== editor.getValue()) {
    const isFocused = editor.hasTextFocus()
    const prevPosition = isFocused ? editor.getPosition() : null
    const prevSelection = isFocused ? editor.getSelection() : null
    editor.setValue(newVal)
    if (isFocused && prevPosition) {
      editor.setPosition(prevPosition)
      editor.revealPositionInCenter(prevPosition)
    }
  }
})

watch(() => appStore.isDark, () => {
  if (editor && monaco) {
    monaco.editor.setTheme(editorTheme.value)
  }
})

onMounted(() => {
  initMonaco()
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
    editor = null
  }
})

defineExpose({
  getEditor: () => editor,
  getMonaco: () => monaco,
  focus: () => editor?.focus(),
  triggerResize: () => editor?.layout(),
})
</script>

<template>
  <div ref="editorContainer" class="h-full w-full"></div>
</template>
