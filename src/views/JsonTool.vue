<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useJsonEditorStore } from '@/stores/json-editor'
import { useAppStore } from '@/stores/app'
import { useToast } from '@/composables/useToast'
import MonacoEditor from '@/components/json/MonacoEditor.vue'
import JsonToolbar from '@/components/json/JsonToolbar.vue'
import SearchReplace from '@/components/json/SearchReplace.vue'
import JsonOutline from '@/components/json/JsonOutline.vue'
import JsonPropertyPanel from '@/components/json/JsonPropertyPanel.vue'
import JsonTreeView from '@/components/json/JsonTreeView.vue'
import JsonFormView from '@/components/json/JsonFormView.vue'
import JsonPreviewView from '@/components/json/JsonPreviewView.vue'
import JsonTableView from '@/components/json/JsonTableView.vue'

const jsonStore = useJsonEditorStore()
const appStore = useAppStore()
const toast = useToast()

type ViewMode = 'code' | 'tree' | 'form' | 'preview' | 'table'

const viewMode = ref<ViewMode>('code')
const editorRef = ref<InstanceType<typeof MonacoEditor>>()
const searchRef = ref<InstanceType<typeof SearchReplace>>()
const selectedPath = ref<string | null>(null)
const rightPanelTab = ref<'outline' | 'properties'>('outline')

let editorInstance: any = null

const viewModes: { key: ViewMode; label: string; icon: string; desc: string }[] = [
  { key: 'code', label: '代码', icon: 'code', desc: 'Monaco 代码编辑器' },
  { key: 'tree', label: '树状', icon: 'sitemap', desc: '可视化树状结构' },
  { key: 'form', label: '表单', icon: 'wpforms', desc: '表单方式编辑' },
  { key: 'preview', label: '预览', icon: 'eye', desc: '格式化渲染预览' },
  { key: 'table', label: '表格', icon: 'table', desc: '数组表格展示' },
]

function switchView(mode: ViewMode) {
  viewMode.value = mode
  nextTick(() => {
    if (mode === 'code') {
      editorRef.value?.triggerResize()
    }
  })
}

function onEditorReady(payload: { editor: any; monaco: any }) {
  editorInstance = payload.editor
}

function handleSearch() {
  if (viewMode.value !== 'code') {
    switchView('code')
  }
  nextTick(() => {
    searchRef.value?.open()
  })
}

function handleNodeSelected(path: string) {
  selectedPath.value = path
  rightPanelTab.value = 'properties'

  if (editorInstance && jsonStore.parsedData) {
    const model = editorInstance.getModel()
    const keyName = path.split('.').pop() || path.split(/\[/).pop()?.replace(/\]/, '') || ''
    if (keyName) {
      const matches = model.findMatches(`"${keyName}"`, false, false, true, null, true)
      if (matches.length > 0) {
        editorInstance.revealRangeInCenter(matches[0].range)
        editorInstance.setSelection(matches[0].range)
      }
    }
  }
}

function onCursorChange(position: { lineNumber: number; column: number }) {
}

function startResize(e: MouseEvent) {
  const startX = e.clientX
  const startWidth = appStore.rightPanelWidth

  function onMouseMove(e: MouseEvent) {
    const dx = startX - e.clientX
    appStore.setRightPanelWidth(startWidth - dx)
  }

  function onMouseUp() {
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

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
    e.preventDefault()
    handleSearch()
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
    e.preventDefault()
    appStore.toggleSidebar()
  }
  if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
    const num = parseInt(e.key)
    if (num >= 1 && num <= viewModes.length) {
      e.preventDefault()
      switchView(viewModes[num - 1].key)
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)

  const sample = {
    name: 'DevToolBox',
    version: '0.1.0',
    description: '开发者工具集',
    features: ['JSON 编辑器', 'Base64 编解码', '正则测试'],
    settings: { theme: 'system', fontSize: 14, language: 'zh-CN' },
    stats: { stars: 128, forks: 32, issues: 0 },
    contributors: [
      { name: '开发者', role: 'owner', active: true },
      { name: '贡献者', role: 'contributor', active: false },
      { name: '测试者', role: 'tester', active: true },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    isOpenSource: true,
    tags: null,
  }
  jsonStore.setContent(JSON.stringify(sample, null, 2))
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 状态栏 -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm flex-shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">JSON 编辑器</h2>
        <span class="text-[10px] text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
          Alt+1~5 切换视图 · Ctrl+Shift+F 搜索
        </span>
      </div>
      <div class="flex items-center gap-3 text-xs">
        <span class="text-gray-500 dark:text-gray-400">{{ jsonStore.lineCount }} 行</span>
        <span class="text-gray-400 dark:text-gray-500">|</span>
        <span class="text-gray-500 dark:text-gray-400">{{ jsonStore.charCount }} 字符</span>
        <span class="text-gray-400 dark:text-gray-500">|</span>
        <span class="text-gray-500 dark:text-gray-400">{{ jsonStore.nodeCount }} 节点</span>
        <span
          class="px-1.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1"
          :class="{
            'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400': jsonStore.statusType === 'success',
            'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400': jsonStore.statusType === 'error',
            'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400': jsonStore.statusType === 'info',
          }"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="{
            'bg-green-500': jsonStore.statusType === 'success',
            'bg-red-500': jsonStore.statusType === 'error',
            'bg-gray-400': jsonStore.statusType === 'info',
          }"></span>
          {{ jsonStore.statusText }}
        </span>
      </div>
    </div>

    <!-- 工具栏 -->
    <JsonToolbar @search="handleSearch" />

    <!-- 视图切换 Tab 栏 -->
    <div class="flex items-center px-4 py-1.5 border-b border-gray-100 dark:border-gray-700/30 bg-gray-50/50 dark:bg-gray-900/30 flex-shrink-0 gap-0.5">
      <button
        v-for="vm in viewModes"
        :key="vm.key"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 relative"
        :class="viewMode === vm.key
          ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-200 dark:border-gray-700'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-transparent'"
        @click="switchView(vm.key)"
        :title="vm.desc"
      >
        <!-- code -->
        <svg v-if="vm.icon === 'code'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
        </svg>
        <!-- sitemap -->
        <svg v-else-if="vm.icon === 'sitemap'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
        </svg>
        <!-- wpforms -->
        <svg v-else-if="vm.icon === 'wpforms'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <!-- eye -->
        <svg v-else-if="vm.icon === 'eye'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        <!-- table -->
        <svg v-else-if="vm.icon === 'table'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <span>{{ vm.label }}</span>
        <span class="text-[9px] text-gray-400 ml-0.5 font-mono">Alt+{{ viewModes.indexOf(vm) + 1 }}</span>
      </button>
    </div>

    <!-- 主体 -->
    <div class="flex-1 flex overflow-hidden relative">
      <div class="flex-1 relative">
        <MonacoEditor
          v-show="viewMode === 'code'"
          ref="editorRef"
          :model-value="jsonStore.content"
          @update:model-value="jsonStore.updateContent"
          @editor-ready="onEditorReady"
          @cursor-change="onCursorChange"
        />

        <SearchReplace
          v-if="viewMode === 'code'"
          ref="searchRef"
          :editor="editorInstance"
        />

        <JsonTreeView v-show="viewMode === 'tree'" />
        <JsonFormView v-show="viewMode === 'form'" />
        <JsonPreviewView v-show="viewMode === 'preview'" />
        <JsonTableView v-show="viewMode === 'table'" />
      </div>

      <div
        v-if="viewMode === 'code'"
        class="w-1 cursor-col-resize hover:bg-primary-400/30 dark:hover:bg-primary-500/30 active:bg-primary-400/50 dark:active:bg-primary-500/50 transition-colors flex-shrink-0 relative group"
        @mousedown="startResize"
      >
        <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 group-hover:bg-primary-400/10 rounded-full transition-colors"></div>
      </div>

      <div
        v-if="viewMode === 'code'"
        class="flex-shrink-0 border-l border-gray-200/60 dark:border-gray-700/30 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm transition-all duration-300 overflow-hidden flex flex-col"
        :style="{ width: `${appStore.rightPanelWidth}px` }"
      >
        <div class="flex border-b border-gray-100 dark:border-gray-700/50 flex-shrink-0">
          <button
            class="flex-1 py-2 text-xs font-medium transition-colors relative"
            :class="rightPanelTab === 'outline' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            @click="rightPanelTab = 'outline'"
          >
            结构大纲
            <div v-if="rightPanelTab === 'outline'" class="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-500 rounded-full"></div>
          </button>
          <button
            class="flex-1 py-2 text-xs font-medium transition-colors relative"
            :class="rightPanelTab === 'properties' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            @click="rightPanelTab = 'properties'"
          >
            属性
            <div v-if="rightPanelTab === 'properties'" class="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-500 rounded-full"></div>
          </button>
        </div>

        <div class="flex-1 overflow-hidden">
          <JsonOutline v-show="rightPanelTab === 'outline'" @node-selected="handleNodeSelected" />
          <JsonPropertyPanel v-show="rightPanelTab === 'properties'" :selected-path="selectedPath" />
        </div>
      </div>
    </div>
  </div>
</template>
