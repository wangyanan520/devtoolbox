<script setup lang="ts">
import { computed } from 'vue'
import { useJsonEditorStore } from '@/stores/json-editor'

const jsonStore = useJsonEditorStore()

const rendered = computed(() => {
  if (!jsonStore.parsedData) return ''
  return renderValue(jsonStore.parsedData, 0)
})

function renderValue(data: any, depth: number): string {
  const indent = '  '.repeat(depth)

  if (data === null) {
    return `<span class="json-null">null</span>`
  }

  const type = Array.isArray(data) ? 'array' : typeof data

  if (type === 'string') {
    return `<span class="json-string">"${escapeHtml(data)}"</span>`
  }

  if (type === 'number') {
    return `<span class="json-number">${data}</span>`
  }

  if (type === 'boolean') {
    return `<span class="json-boolean">${data}</span>`
  }

  if (type === 'array') {
    if (data.length === 0) return '<span class="json-bracket">[</span><span class="json-bracket">]</span>'

    let html = `<span class="json-bracket">[</span>\n`
    data.forEach((item: any, i: number) => {
      html += `${indent}  ${renderValue(item, depth + 1)}`
      if (i < data.length - 1) html += '<span class="json-comma">,</span>'
      html += '\n'
    })
    html += `${indent}<span class="json-bracket">]</span>`
    return html
  }

  if (type === 'object') {
    const keys = Object.keys(data)
    if (keys.length === 0) return '<span class="json-bracket">{</span><span class="json-bracket">}</span>'

    let html = `<span class="json-bracket">{</span>\n`
    keys.forEach((key, i) => {
      html += `${indent}  <span class="json-key">"${escapeHtml(key)}"</span><span class="json-colon">: </span>${renderValue(data[key], depth + 1)}`
      if (i < keys.length - 1) html += '<span class="json-comma">,</span>'
      html += '\n'
    })
    html += `${indent}<span class="json-bracket">}</span>`
    return html
  }

  return String(data)
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
</script>

<template>
  <div class="h-full overflow-y-auto bg-white dark:bg-gray-900/50">
    <div v-if="!jsonStore.parsedData" class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
      <svg class="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
      <span class="text-xs">输入有效的 JSON 后显示预览</span>
    </div>

    <div v-else class="p-6">
      <pre
        class="font-mono text-sm leading-relaxed whitespace-pre-wrap break-all"
        v-html="rendered"
      ></pre>
    </div>
  </div>
</template>

<style scoped>
:deep(.json-string) { color: #10b981; }
:deep(.json-number) { color: #3b82f6; }
:deep(.json-boolean) { color: #f59e0b; }
:deep(.json-null) { color: #6b7280; font-style: italic; }
:deep(.json-key) { color: #f97316; }
:deep(.json-bracket) { color: #8b5cf6; font-weight: 500; }
:deep(.json-colon) { color: #6b7280; }
:deep(.json-comma) { color: #6b7280; }

.dark :deep(.json-string) { color: #34d399; }
.dark :deep(.json-number) { color: #60a5fa; }
.dark :deep(.json-boolean) { color: #fbbf24; }
.dark :deep(.json-null) { color: #9ca3af; }
.dark :deep(.json-key) { color: #fb923c; }
.dark :deep(.json-bracket) { color: #a78bfa; }
.dark :deep(.json-colon) { color: #9ca3af; }
.dark :deep(.json-comma) { color: #9ca3af; }
</style>
