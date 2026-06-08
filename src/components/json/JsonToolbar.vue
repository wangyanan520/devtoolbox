<script setup lang="ts">
import { ref, computed } from 'vue'
import { useJsonEditorStore } from '@/stores/json-editor'
import { useToast } from '@/composables/useToast'
import { formatFileSize } from '@/utils/json'

const emit = defineEmits<{
  (e: 'search'): void
}>()

const jsonStore = useJsonEditorStore()
const toast = useToast()
const indentSize = ref(2)
const showIndentPicker = ref(false)

const encodedLength = computed(() => {
  try {
    return new TextEncoder().encode(jsonStore.content).length
  } catch {
    return jsonStore.content.length
  }
})

function format() {
  if (!jsonStore.content.trim()) {
    toast.info('提示', '编辑器为空')
    return
  }
  if (!jsonStore.isValid) {
    toast.warning('格式无效', '请先修复 JSON 格式错误')
    return
  }
  jsonStore.format(indentSize.value)
  toast.success('格式化完成', `缩进 ${indentSize.value} 空格`)
}

function compact() {
  if (!jsonStore.content.trim()) {
    toast.info('提示', '编辑器为空')
    return
  }
  if (!jsonStore.isValid) {
    toast.warning('格式无效', '请先修复 JSON 格式错误')
    return
  }
  jsonStore.compact()
  toast.success('压缩完成')
}

function validate() {
  const valid = jsonStore.validate()
  if (!jsonStore.content.trim()) {
    toast.info('编辑器为空')
    return
  }
  if (valid) {
    toast.success('验证通过', 'JSON 格式有效')
  } else {
    toast.error('验证失败', jsonStore.errorMessage)
  }
}

function copy() {
  if (!jsonStore.content.trim()) {
    toast.info('提示', '编辑器为空')
    return
  }
  navigator.clipboard.writeText(jsonStore.content).then(() => {
    toast.success('已复制', 'JSON 已复制到剪贴板')
  }).catch(() => {
    toast.error('复制失败', '请手动复制')
  })
}

function clear() {
  if (!jsonStore.content.trim()) {
    toast.info('提示', '编辑器已为空')
    return
  }
  jsonStore.setContent('')
  toast.success('已清空')
}

function download() {
  if (!jsonStore.content.trim()) {
    toast.info('提示', '编辑器为空')
    return
  }
  if (!jsonStore.isValid) {
    toast.warning('格式无效', '请先修复 JSON 格式错误')
    return
  }
  const blob = new Blob([jsonStore.content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'data.json'
  a.click()
  URL.revokeObjectURL(url)
  toast.success('下载完成')
}

const fileSize = ref('')

function loadSample() {
  const sample = {
    name: 'DevToolBox',
    version: '0.1.0',
    description: '开发者工具集',
    features: ['JSON 编辑器', 'Base64 编解码', '正则测试'],
    settings: { theme: 'system', fontSize: 14, language: 'zh-CN' },
    stats: { stars: 128, forks: 32, issues: 0 },
    contributors: [
      { name: '开发者', role: 'owner', active: true },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    isOpenSource: true,
    tags: null,
  }
  jsonStore.setContent(JSON.stringify(sample, null, 2))
  toast.success('已加载示例数据')
}

function uploadFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json, .txt'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    jsonStore.setContent(text)
    toast.success('导入成功', `文件 ${file.name}`)
  }
  input.click()
}

function importFromUrl() {
  const url = prompt('请输入 JSON 文件的 URL:')
  if (!url) return
  toast.info('正在获取...')
  fetch(url)
    .then(res => res.text())
    .then(text => {
      jsonStore.setContent(text)
      toast.success('导入成功')
    })
    .catch(() => toast.error('导入失败', '无法获取 URL 内容'))
}
</script>

<template>
  <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200/60 dark:border-gray-700/30 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm flex-shrink-0">
    <div class="flex items-center gap-1 flex-wrap">
      <button class="toolbar-btn" title="格式化 JSON" @click="format">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
        </svg>
        <span>格式化</span>
      </button>

      <button class="toolbar-btn" title="压缩 JSON" @click="compact">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        <span>压缩</span>
      </button>

      <div class="relative">
        <button class="toolbar-btn" title="缩进大小" @click="showIndentPicker = !showIndentPicker">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
          <span>缩进 {{ indentSize }}</span>
        </button>
        <div
          v-if="showIndentPicker"
          class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-1 z-50 min-w-[100px]"
          @mouseleave="showIndentPicker = false"
        >
          <button
            v-for="n in [2, 4, 6, 8]"
            :key="n"
            class="w-full text-left px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{ 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400': indentSize === n }"
            @click="indentSize = n; showIndentPicker = false"
          >
            {{ n }} 空格
          </button>
        </div>
      </div>

      <div class="w-px h-5 mx-1 bg-gray-200 dark:bg-gray-700"></div>

      <button class="toolbar-btn" title="验证 JSON" @click="validate">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>验证</span>
      </button>

      <button class="toolbar-btn" title="搜索替换" @click="emit('search')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <span>搜索</span>
      </button>

      <div class="w-px h-5 mx-1 bg-gray-200 dark:bg-gray-700"></div>

      <button class="toolbar-btn" title="复制到剪贴板" @click="copy">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <span>复制</span>
      </button>

      <button class="toolbar-btn" title="下载 JSON 文件" @click="download">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span>下载</span>
      </button>

      <button class="toolbar-btn text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="清空" @click="clear">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        <span>清空</span>
      </button>
    </div>

    <div class="flex items-center gap-2">
      <!-- 文件大小 -->
      <span v-if="jsonStore.content" class="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
        {{ formatFileSize(encodedLength) }}
      </span>

      <!-- 导入 -->
      <div class="relative group">
        <button class="toolbar-btn text-xs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          <span>导入</span>
        </button>
        <div class="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-1 z-50 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <button class="w-full text-left px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" @click="loadSample">
            示例数据
          </button>
          <button class="w-full text-left px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" @click="uploadFile">
            上传文件
          </button>
          <button class="w-full text-left px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" @click="importFromUrl">
            从 URL 导入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-btn {
  @apply flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium
  text-gray-600 dark:text-gray-400
  hover:bg-gray-100 dark:hover:bg-gray-800
  active:scale-95
  transition-all duration-150;
}
</style>
