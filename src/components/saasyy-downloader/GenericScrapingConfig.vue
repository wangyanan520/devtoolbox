<script setup lang="ts">
import { useSaasyyDownloaderStore } from '@/stores/saasyy-downloader'

const store = useSaasyyDownloaderStore()
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        <span class="inline-flex items-center gap-1">
          入口 URL
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">必填</span>
        </span>
      </label>
      <input
        :value="store.genericConfig.entryUrl"
        @input="(e: Event) => { store.genericConfig.entryUrl = (e.target as HTMLInputElement).value; store.saveGenericConfig() }"
        type="url"
        class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 outline-none transition-all"
        placeholder="https://www.chanjetvip.com/doc/cate-68/second-106.html"
      />
    </div>

    <div>
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        <span class="inline-flex items-center gap-1">
          文章链接 CSS 选择器
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">必填</span>
        </span>
      </label>
      <input
        :value="store.genericConfig.linkSelector"
        @input="(e: Event) => { store.genericConfig.linkSelector = (e.target as HTMLInputElement).value; store.saveGenericConfig() }"
        class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 outline-none transition-all"
        placeholder='a[href*="/doc/cate-68/doc-"]'
      />
    </div>

    <div>
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        <span class="inline-flex items-center gap-1">
          文章标题 CSS 选择器
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">必填</span>
        </span>
      </label>
      <input
        :value="store.genericConfig.titleSelector"
        @input="(e: Event) => { store.genericConfig.titleSelector = (e.target as HTMLInputElement).value; store.saveGenericConfig() }"
        class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 outline-none transition-all"
        placeholder="h1"
      />
    </div>

    <div>
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        <span class="inline-flex items-center gap-1">
          正文内容 CSS 选择器
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">必填</span>
        </span>
      </label>
      <input
        :value="store.genericConfig.contentSelector"
        @input="(e: Event) => { store.genericConfig.contentSelector = (e.target as HTMLInputElement).value; store.saveGenericConfig() }"
        class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 outline-none transition-all"
        placeholder=".article-content"
      />
    </div>

    <div>
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        <span class="inline-flex items-center gap-1">
          翻页选择器
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">可选</span>
        </span>
      </label>
      <input
        :value="store.genericConfig.paginationSelector"
        @input="(e: Event) => { store.genericConfig.paginationSelector = (e.target as HTMLInputElement).value; store.saveGenericConfig() }"
        class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 outline-none transition-all"
        placeholder=".pagination .next a（留空则只扫描当前页）"
      />
    </div>

    <div>
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        <span class="inline-flex items-center gap-1">
          Cookie
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">可选</span>
        </span>
      </label>
      <textarea
        :value="store.genericConfig.cookie"
        @input="(e: Event) => { store.genericConfig.cookie = (e.target as HTMLTextAreaElement).value; store.saveGenericConfig() }"
        rows="2"
        class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 outline-none transition-all resize-none"
        placeholder="登录后从浏览器开发者工具中复制（用于需要登录的站点）"
      />
    </div>

    <div v-if="store.scrapingError" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
      <svg class="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="text-xs text-red-600 dark:text-red-400">{{ store.scrapingError }}</span>
    </div>

    <div v-if="store.scrapedArticles.length > 0" class="px-2.5 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-900/30">
      <span class="text-xs text-primary-600 dark:text-primary-400 font-medium">扫描到 {{ store.scrapedArticles.length }} 篇文章</span>
    </div>

    <button
      @click="store.scanArticles()"
      :disabled="!store.genericConfig.entryUrl.trim() || !store.genericConfig.linkSelector.trim() || !store.genericConfig.titleSelector.trim() || !store.genericConfig.contentSelector.trim() || store.isScanning"
      class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
      :class="store.isScanning
        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-wait'
        : (store.genericConfig.entryUrl.trim() && store.genericConfig.linkSelector.trim() && store.genericConfig.titleSelector.trim() && store.genericConfig.contentSelector.trim()
          ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed')"
    >
      <svg v-if="store.isScanning" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      {{ store.isScanning ? '扫描中...' : '扫描文章' }}
    </button>
  </div>
</template>
