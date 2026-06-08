<script setup lang="ts">
import { computed } from 'vue'
import { useSaasyyDownloaderStore } from '@/stores/saasyy-downloader'
import { generateScriptContent } from './pythonScriptTemplate'
import { generateGenericScriptContent } from './genericScriptTemplate'
import { generateYuqueScriptContent } from './yuqueScriptTemplate'

const store = useSaasyyDownloaderStore()

function generateAndDownload() {
  if (!store.isConfigValid) return
  if (!store.hasSelection) return

  let scriptContent: string
  let filename: string

  if (store.mode === 'saasyy') {
    const selectedIds = Array.from(store.selectedIds)
    scriptContent = generateScriptContent(
      store.authConfig.cookie,
      store.authConfig.accessProfile,
      store.rawCatalogJson,
      selectedIds,
      store.generatePdf,
    )
    filename = 'download_saasyy.py'
  } else if (store.mode === 'generic') {
    const selectedArticles = store.scrapedArticles.filter(a => a.checked)
    scriptContent = generateGenericScriptContent(store.genericConfig, selectedArticles)
    filename = 'scrape_generic.py'
  } else {
    scriptContent = generateYuqueScriptContent(
      store.yuqueConfig.entryUrl,
      store.yuqueConfig.outputDir || './Yuque知识库',
    )
    filename = 'yuque_downloader.py'
  }

  const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const totalFiles = computed(() => store.stats.selectedArticles + store.stats.selectedVideos)
const allFiles = computed(() => store.stats.totalArticles + store.stats.totalVideos)

const genericTooltip = computed(() => {
  if (!store.genericConfig.entryUrl.trim()) return '请先配置入口 URL 和 CSS 选择器'
  if (!store.hasSelection) return '请至少勾选一篇文章'
  return ''
})

const saasyyTooltip = computed(() => {
  if (!store.isConfigValid) return '请先填写认证信息'
  if (!store.hasSelection) return '请至少勾选一个下载项'
  return ''
})

const yuqueTooltip = computed(() => {
  if (!store.yuqueConfig.entryUrl.trim()) return '请输入语雀知识库 URL'
  return ''
})
</script>

<template>
  <div class="flex-shrink-0 border-t border-gray-200 dark:border-gray-700/30 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-4 py-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          <template v-if="store.mode === 'saasyy'">
            <template v-if="store.isCatalogReady">
              <span v-if="store.hasSelection">
                已勾选 <strong class="text-gray-700 dark:text-gray-300">{{ totalFiles }}</strong> / {{ allFiles }} 个文件
                <span class="text-gray-300 dark:text-gray-600 mx-1">|</span>
                图文 {{ store.stats.selectedArticles }} / {{ store.stats.totalArticles }}
                <span class="text-gray-300 dark:text-gray-600 mx-1">|</span>
                视频 {{ store.stats.selectedVideos }} / {{ store.stats.totalVideos }}
              </span>
              <span v-else class="text-yellow-600 dark:text-yellow-400">请至少勾选一个下载项</span>
            </template>
            <template v-else>
              配置完成后，解析目录并勾选内容
            </template>
          </template>

          <template v-else-if="store.mode === 'generic'">
            <template v-if="store.scrapedArticles.length > 0">
              <span v-if="store.hasSelection">
                已勾选 <strong class="text-gray-700 dark:text-gray-300">{{ store.selectedArticleIds.size }}</strong> / {{ store.scrapedArticles.length }} 篇文章
              </span>
              <span v-else class="text-yellow-600 dark:text-yellow-400">请至少勾选一篇文章</span>
            </template>
            <template v-else>
              配置参数后，扫描文章并勾选内容
            </template>
          </template>

          <template v-else>
            <template v-if="store.yuqueConfig.entryUrl.trim()">
              <span v-if="store.hasSelection">
                已勾选 <strong class="text-gray-700 dark:text-gray-300">{{ store.getYuqueSelectedCount }}</strong> / {{ store.getYuqueTotalCount }} 篇文章
              </span>
              <span v-else class="text-yellow-600 dark:text-yellow-400">请至少勾选一个下载项</span>
            </template>
            <template v-else>
              填写语雀知识库 URL 后生成下载脚本
            </template>
          </template>
        </div>
        <label
          v-if="store.mode === 'saasyy' && store.isCatalogReady && store.hasSelection"
          class="flex items-center gap-2 cursor-pointer select-none"
        >
          <div
            class="relative w-9 h-5 rounded-full transition-colors"
            :class="store.generatePdf ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'"
            @click="store.generatePdf = !store.generatePdf"
          >
            <div
              class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
              :class="store.generatePdf ? 'translate-x-4' : 'translate-x-0'"
            />
          </div>
          <span class="text-xs" :class="store.generatePdf ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-400 dark:text-gray-500'">
            合成 PDF
          </span>
        </label>
      </div>

      <button
        @click="generateAndDownload"
        :disabled="!store.isConfigValid || !store.hasSelection"
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        :class="store.isConfigValid && store.hasSelection
          ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'"
        :title="store.mode === 'saasyy' ? saasyyTooltip : (store.mode === 'generic' ? genericTooltip : yuqueTooltip)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        生成并下载脚本
      </button>
    </div>
  </div>
</template>
