<script setup lang="ts">
import { useSaasyyDownloaderStore } from '@/stores/saasyy-downloader'

const store = useSaasyyDownloaderStore()
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        <span class="inline-flex items-center gap-1">
          语雀知识库 URL
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">必填</span>
        </span>
      </label>
      <input
        :value="store.yuqueConfig.entryUrl"
        @input="(e: Event) => { store.yuqueConfig.entryUrl = (e.target as HTMLInputElement).value; store.saveYuqueConfig() }"
        type="url"
        class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 outline-none transition-all"
        placeholder="https://www.yuque.com/username/repo/welcome"
      />
      <p class="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
        知识库的入口页面 URL，例如 https://www.yuque.com/zhangwei-m5fap/kngna3/welcome
      </p>
    </div>

    <div>
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        <span class="inline-flex items-center gap-1">
          输出目录名称
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">可选</span>
        </span>
      </label>
      <input
        :value="store.yuqueConfig.outputDir"
        @input="(e: Event) => { store.yuqueConfig.outputDir = (e.target as HTMLInputElement).value; store.saveYuqueConfig() }"
        class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 outline-none transition-all"
        placeholder="./Yuque知识库"
      />
    </div>

    <div v-if="store.yuqueParseError" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
      <svg class="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="text-xs text-red-600 dark:text-red-400">{{ store.yuqueParseError }}</span>
    </div>

    <div
      v-if="store.yuqueConfig.entryUrl.trim() && !store.yuqueParseError"
      class="px-2.5 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-900/30"
    >
      <div class="text-xs text-primary-600 dark:text-primary-400 space-y-1">
        <p class="font-medium">✓ URL 格式有效</p>
        <p>用户: <code class="font-mono">{{ store.getYuqueUserSlug() }}</code></p>
        <p>知识库: <code class="font-mono">{{ store.getYuqueRepoSlug() }}</code></p>
      </div>
    </div>

    <div class="border-t border-gray-100 dark:border-gray-800 pt-3">
      <details class="group">
        <summary class="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 transition-colors cursor-pointer list-none">
          <svg class="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          使用说明
        </summary>
        <div class="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 space-y-2.5">
          <div class="space-y-1">
            <p class="font-medium text-gray-700 dark:text-gray-300">快速开始</p>
            <p>1. 将语雀知识库的入口页面 URL 粘贴到上方输入框</p>
            <p>2. （可选）修改输出目录名称</p>
            <p>3. 点击底部"生成并下载脚本"</p>
          </div>
          <div class="space-y-1">
            <p class="font-medium text-gray-700 dark:text-gray-300">运行脚本</p>
            <p>1. 安装 Python 依赖（首次运行）:</p>
            <pre class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-[10px] text-primary-600 dark:text-primary-400">pip install playwright beautifulsoup4 requests
python -m playwright install chromium</pre>
            <p>2. 运行脚本:</p>
            <pre class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-[10px] text-primary-600 dark:text-primary-400">python yuque_downloader.py</pre>
          </div>
          <div class="space-y-1">
            <p class="font-medium text-gray-700 dark:text-gray-300">注意事项</p>
            <p>• 仅支持公开的知识库，无需登录</p>
            <p>• 脚本会自动爬取目录结构并下载所有文章</p>
            <p>• 文章中的图片会被自动下载到本地</p>
            <p>• 首次运行需要下载浏览器（约 300MB），耗时较长</p>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>
