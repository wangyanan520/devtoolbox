<script setup lang="ts">
import { ref } from 'vue'
import { useSaasyyDownloaderStore } from '@/stores/saasyy-downloader'
import AuthConfigPanel from '@/components/saasyy-downloader/AuthConfigPanel.vue'
import CatalogTreePanel from '@/components/saasyy-downloader/CatalogTreePanel.vue'
import ScriptGeneratorBar from '@/components/saasyy-downloader/ScriptGeneratorBar.vue'
import GenericScrapingConfig from '@/components/saasyy-downloader/GenericScrapingConfig.vue'
import ArticleListPanel from '@/components/saasyy-downloader/ArticleListPanel.vue'
import YuqueConfigPanel from '@/components/saasyy-downloader/YuqueConfigPanel.vue'

const store = useSaasyyDownloaderStore()
const showTree = ref(false)

function onParsed() {
  showTree.value = true
}

function onReparse() {
  showTree.value = false
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm flex-shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">批量下载器</h2>
      </div>
    </div>

    <div class="flex items-center gap-1 px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex-shrink-0">
      <button
        @click="store.mode = 'saasyy'"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        :class="store.mode === 'saasyy'
          ? 'bg-primary-500 text-white shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
      >
        SaaSSY 预设
      </button>
      <button
        @click="store.mode = 'generic'"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        :class="store.mode === 'generic'
          ? 'bg-primary-500 text-white shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
      >
        通用网页抓取
      </button>
      <button
        @click="store.mode = 'yuque'"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        :class="store.mode === 'yuque'
          ? 'bg-primary-500 text-white shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
      >
        语雀文档
      </button>
      <span class="ml-auto text-[10px] text-gray-400 dark:text-gray-500 font-mono">
        <template v-if="store.mode === 'saasyy'">填写信息 → 解析目录 → 勾选内容 → 下载脚本</template>
        <template v-else-if="store.mode === 'generic'">配置参数 → 扫描文章 → 勾选内容 → 下载脚本</template>
        <template v-else>填写 URL → 生成脚本 → 本地运行</template>
      </span>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="w-[340px] flex-shrink-0 border-r border-gray-200 dark:border-gray-700/30 p-4 overflow-y-auto">
        <AuthConfigPanel v-if="store.mode === 'saasyy'" @parsed="onParsed" />
        <GenericScrapingConfig v-else-if="store.mode === 'generic'" />
        <YuqueConfigPanel v-else />
      </div>

      <div class="flex-1 p-4 overflow-hidden flex flex-col">
        <template v-if="store.mode === 'saasyy'">
          <div v-if="!showTree" class="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            <div class="text-center space-y-2">
              <svg class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p>请在左侧填写三份信息后点击"解析目录"</p>
              <p class="text-xs text-gray-300 dark:text-gray-600">Cookie · AccessProfile · 目录 JSON</p>
            </div>
          </div>
          <div v-else class="flex-1 flex flex-col overflow-hidden">
            <div class="flex-1 overflow-y-auto">
              <CatalogTreePanel @reparse="onReparse" />
            </div>
          </div>
        </template>

        <template v-else-if="store.mode === 'generic'">
          <ArticleListPanel />
        </template>

        <template v-else>
          <div class="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            <div class="text-center space-y-2">
              <svg class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
              </svg>
              <p>在左侧粘贴语雀知识库 URL</p>
              <p class="text-xs text-gray-300 dark:text-gray-600">点击底部按钮生成 Python 下载脚本</p>
            </div>
          </div>
        </template>
      </div>
    </div>

    <ScriptGeneratorBar />
  </div>
</template>
