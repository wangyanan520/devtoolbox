<script setup lang="ts">
import { useSaasyyDownloaderStore } from '@/stores/saasyy-downloader'

const store = useSaasyyDownloaderStore()

function handleToggle(id: string) {
  store.toggleArticle(id)
}

function handleSelectAll() {
  store.selectAllArticles()
}

function handleDeselectAll() {
  store.deselectAllArticles()
}
</script>

<template>
  <div class="h-full flex flex-col">
    <template v-if="store.scrapedArticles.length === 0 && !store.scrapingError">
      <div class="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        <div class="text-center space-y-2">
          <svg class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p>请在左侧配置抓取参数后点击"扫描文章"</p>
          <p class="text-xs text-gray-300 dark:text-gray-600">入口 URL · CSS 选择器</p>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <button
            @click="handleSelectAll"
            class="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            ☑ 全选
          </button>
          <button
            @click="handleDeselectAll"
            class="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            ☐ 取消全选
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2">
        <div
          v-for="article in store.scrapedArticles"
          :key="article.id"
          class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
          @click="handleToggle(article.id)"
        >
          <input
            type="checkbox"
            :checked="article.checked"
            @click.stop="handleToggle(article.id)"
            class="rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-400 flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <span class="text-xs text-gray-700 dark:text-gray-300 block truncate">{{ article.title }}</span>
            <span class="text-[10px] text-gray-400 dark:text-gray-500 block truncate">{{ article.url }}</span>
          </div>
        </div>
      </div>

      <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          共扫描 <span class="font-medium text-gray-700 dark:text-gray-300">{{ store.scrapedArticles.length }}</span> 篇，
          已选 <span class="font-medium text-primary-500">{{ store.selectedArticleIds.size }}</span> 篇
        </div>
      </div>
    </template>
  </div>
</template>
