<script setup lang="ts">
import { useSaasyyDownloaderStore } from '@/stores/saasyy-downloader'
import { ref } from 'vue'

const store = useSaasyyDownloaderStore()
const guideOpen = ref(false)

const emit = defineEmits<{
  parsed: []
}>()

function onCookieChange(e: Event) {
  store.authConfig.cookie = (e.target as HTMLTextAreaElement).value
  store.saveAuthConfig()
}

function onAccessProfileChange(e: Event) {
  store.authConfig.accessProfile = (e.target as HTMLTextAreaElement).value
  store.saveAuthConfig()
}

function onJsonChange(e: Event) {
  store.rawCatalogJson = (e.target as HTMLTextAreaElement).value
}

function handleParse() {
  const success = store.parseCatalog()
  if (success) {
    emit('parsed')
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        <span class="inline-flex items-center gap-1">
          Cookie
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">必填</span>
        </span>
      </label>
      <textarea
        :value="store.authConfig.cookie"
        @input="onCookieChange"
        rows="3"
        class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 outline-none transition-all resize-none"
        placeholder="ASP.NET_SessionId=...; _AUTH_KANGLONG=..."
      />
    </div>

    <div>
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        <span class="inline-flex items-center gap-1">
          AccessProfile
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">必填</span>
        </span>
      </label>
      <textarea
        :value="store.authConfig.accessProfile"
        @input="onAccessProfileChange"
        rows="2"
        class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 outline-none transition-all resize-none"
        placeholder="5E355A11D0A895862CC19746B4FCA420..."
      />
    </div>

    <div>
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        <span class="inline-flex items-center gap-1">
          目录 JSON
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">必填</span>
        </span>
      </label>
      <textarea
        :value="store.rawCatalogJson"
        @input="onJsonChange"
        rows="6"
        class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 outline-none transition-all resize-none"
        placeholder='{"status":true,"error":"OK","list":[...]}'
      />
      <div
        v-if="store.parseError"
        class="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30"
      >
        <svg class="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="text-xs text-red-600 dark:text-red-400">{{ store.parseError }}</span>
      </div>
    </div>

    <button
      @click="handleParse"
      :disabled="!store.rawCatalogJson.trim()"
      class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
      :class="store.rawCatalogJson.trim()
        ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      解析目录
    </button>

    <div class="border-t border-gray-100 dark:border-gray-800 pt-3">
      <button
        @click="guideOpen = !guideOpen"
        class="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 transition-colors"
      >
        <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-90': guideOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
        如何获取这些信息？
      </button>

      <div
        v-if="guideOpen"
        class="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 space-y-2.5"
      >
        <div class="space-y-1">
          <p class="font-medium text-gray-700 dark:text-gray-300">第一步：登录并打开开发者工具</p>
          <p>1. 在浏览器中打开 <code class="text-primary-500">https://demo.saasyy.com</code> 并登录</p>
          <p>2. 按 <kbd class="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">F12</kbd> 打开开发者工具</p>
          <p>3. 点击顶部 <strong>Network（网络）</strong> 标签页</p>
        </div>

        <div class="space-y-1">
          <p class="font-medium text-gray-700 dark:text-gray-300">第二步：获取 Cookie 和 AccessProfile</p>
          <p>1. 点击左侧菜单"学习" → 任意一个教程</p>
          <p>2. 在 Network 面板中找到 <code class="text-primary-500">SysSettingHandler.ashx</code></p>
          <p>3. 点击该请求 → 查看 <strong>Request Headers（请求头）</strong></p>
          <p>4. 复制 <code class="text-primary-500">Cookie</code> 整行值 → 粘贴到上方 Cookie 输入框</p>
          <p>5. 复制 <code class="text-primary-500">accessprofile</code> 的值 → 粘贴到上方 AccessProfile 输入框</p>
        </div>

        <div class="space-y-1">
          <p class="font-medium text-gray-700 dark:text-gray-300">第三步：获取目录 JSON</p>
          <p>1. 在 Network 面板中找到请求 <code class="text-primary-500">SysSettingHandler.ashx</code> 且 Payload 为 <code class="text-primary-500">visit=getmanualcategorylist</code></p>
          <p>2. 点击该请求 → 查看 <strong>Response（响应）</strong> 标签页</p>
          <p>3. 复制整个 JSON 响应内容（以 <code class="text-primary-500">{</code> 开头的内容）</p>
          <p>4. 粘贴到上方"目录 JSON"输入框</p>
        </div>

        <div class="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30">
          <p class="text-blue-600 dark:text-blue-400">
            💡 Cookie 和 AccessProfile 已自动保存到浏览器，下次使用无需重新填写。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
