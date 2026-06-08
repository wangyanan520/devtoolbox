<script setup lang="ts">
import { ref } from 'vue'
import { useYamlConverterStore } from '@/stores/yaml-converter'
import MonacoEditor from '@/components/json/MonacoEditor.vue'

const store = useYamlConverterStore()

const yamlEditorRef = ref<InstanceType<typeof MonacoEditor>>()
const jsonEditorRef = ref<InstanceType<typeof MonacoEditor>>()

function onYamlEditorReady(payload: { editor: any; monaco: any }) {
}

function onJsonEditorReady(payload: { editor: any; monaco: any }) {
}

let yamlCursorPos = ref({ lineNumber: 1, column: 1 })
let jsonCursorPos = ref({ lineNumber: 1, column: 1 })

function onYamlCursorChange(pos: { lineNumber: number; column: number }) {
  yamlCursorPos.value = pos
}

function onJsonCursorChange(pos: { lineNumber: number; column: number }) {
  jsonCursorPos.value = pos
}

const dividerX = ref(50)
const isDragging = ref(false)

function startDividerDrag(e: MouseEvent) {
  isDragging.value = true
  const container = (e.target as HTMLElement).parentElement!
  const rect = container.getBoundingClientRect()

  function onMouseMove(e: MouseEvent) {
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    dividerX.value = Math.max(20, Math.min(80, pct))
  }

  function onMouseUp() {
    isDragging.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function importFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.yaml,.yml,.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      store.errorMessage = '内容过大，建议分段处理（超过 1MB）'
      store.errorSide = null
      return
    }

    const text = await file.text()
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'yaml' || ext === 'yml') {
      store.onYamlChange(text)
      store.flushYamlToJson()
    } else if (ext === 'json') {
      store.onJsonChange(text)
      store.flushJsonToYaml()
    }
  }
  input.click()
}

function exportFile() {
  const menu = document.createElement('div')
  menu.className = 'fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-40'
  menu.style.top = '120px'
  menu.style.right = '140px'

  const items = [
    { label: '导出为 YAML', format: 'yaml' as const, content: store.yamlContent, ext: 'yaml' },
    { label: '导出为 JSON', format: 'json' as const, content: store.jsonContent, ext: 'json' },
  ]

  items.forEach((item) => {
    const btn = document.createElement('button')
    btn.className = 'w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
    btn.textContent = item.label
    btn.onclick = () => {
      const blob = new Blob([item.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `converted.${item.ext}`
      a.click()
      URL.revokeObjectURL(url)
      menu.remove()
    }
    menu.appendChild(btn)
  })

  document.body.appendChild(menu)

  function onClickOutside(e: MouseEvent) {
    if (!menu.contains(e.target as Node)) {
      menu.remove()
      document.removeEventListener('mousedown', onClickOutside)
    }
  }
  setTimeout(() => document.addEventListener('mousedown', onClickOutside), 0)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm flex-shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">YAML/JSON 互转</h2>
        <span class="text-[10px] text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
          双端实时转换
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="importFile"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          导入
        </button>
        <button
          @click="exportFile"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          导出
        </button>
      </div>
    </div>

    <!-- 错误提示条 -->
    <div
      v-if="store.hasError"
      class="flex items-center gap-2 px-4 py-1.5 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex-shrink-0"
    >
      <svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="text-xs text-red-600 dark:text-red-400">
        <span class="font-medium">{{ store.errorSide === 'yaml' ? 'YAML' : 'JSON' }} 错误:</span>
        {{ store.errorMessage }}
      </span>
    </div>

    <!-- 主体区域 -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- 左侧 YAML 编辑器 -->
      <div class="flex-shrink-0 overflow-hidden relative" :style="{ width: `${dividerX}%` }">
        <MonacoEditor
          ref="yamlEditorRef"
          :model-value="store.yamlContent"
          @update:model-value="store.onYamlChange"
          language="yaml"
          @editor-ready="onYamlEditorReady"
          @cursor-change="onYamlCursorChange"
        />
        <div class="absolute top-0 left-0 px-2 py-1 text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-white/70 dark:bg-gray-900/70 rounded-br">
          YAML
        </div>
      </div>

      <!-- 可拖拽分隔条 -->
      <div
        class="w-1 cursor-col-resize hover:bg-primary-400/30 dark:hover:bg-primary-500/30 active:bg-primary-400/50 dark:active:bg-primary-500/50 transition-colors flex-shrink-0 relative group"
        @mousedown="startDividerDrag"
      >
        <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 group-hover:bg-primary-400/10 rounded-full transition-colors"></div>
      </div>

      <!-- 右侧 JSON 编辑器 -->
      <div class="flex-1 overflow-hidden relative">
        <MonacoEditor
          ref="jsonEditorRef"
          :model-value="store.jsonContent"
          @update:model-value="store.onJsonChange"
          language="json"
          @editor-ready="onJsonEditorReady"
          @cursor-change="onJsonCursorChange"
        />
        <div class="absolute top-0 left-0 px-2 py-1 text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-white/70 dark:bg-gray-900/70 rounded-br">
          JSON
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="flex items-center justify-between px-4 py-1.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex-shrink-0">
      <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>YAML: {{ store.yamlLineCount }} 行 · {{ store.yamlCharCount }} 字符</span>
        <span class="text-gray-300 dark:text-gray-600">|</span>
        <span>JSON: {{ store.jsonLineCount }} 行 · {{ store.jsonCharCount }} 字符</span>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span
          class="px-1.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1"
          :class="{
            'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400': store.yamlValid && store.jsonValid,
            'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400': !store.yamlValid || !store.jsonValid,
            'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400': !store.yamlContent && !store.jsonContent,
          }"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="{
              'bg-green-500': store.yamlValid && store.jsonValid && (store.yamlContent || store.jsonContent),
              'bg-red-500': !store.yamlValid || !store.jsonValid,
              'bg-gray-400': !store.yamlContent && !store.jsonContent,
            }"
          ></span>
          <template v-if="!store.yamlContent && !store.jsonContent">编辑器为空</template>
          <template v-else-if="store.yamlValid && store.jsonValid">格式有效</template>
          <template v-else>格式无效</template>
        </span>
      </div>
    </div>
  </div>
</template>
