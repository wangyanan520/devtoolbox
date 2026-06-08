<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const quickTools = [
  { id: 'json', name: 'JSON 编辑器', icon: '{}', route: '/json', desc: '格式化、编辑、验证 JSON 数据', color: 'from-blue-500 to-blue-600' },
  { id: 'yaml-json', name: 'YAML/JSON 互转', icon: '<>', route: '/yaml-json', desc: 'YAML 与 JSON 双向实时转换', color: 'from-emerald-500 to-emerald-600' },
  { id: 'html-to-pdf', name: 'HTML 转 PDF', icon: 'PDF', route: '/html-to-pdf', desc: '粘贴 HTML 代码直接转为 PDF 文件', color: 'from-orange-500 to-orange-600' },
]

const disabledTools = [
  { id: 'base64', name: 'Base64 编解码', icon: 'B64', route: '/base64', desc: 'Base64 编码与解码' },
  { id: 'regex', name: '正则表达式', icon: '.*', route: '/regex', desc: '正则测试与调试' },
  { id: 'diff', name: '文本对比', icon: '<>', route: '/diff', desc: '对比两段文本差异' },
  { id: 'timestamp', name: '时间戳转换', icon: 'T', route: '/timestamp', desc: '时间戳与日期互转' },
  { id: 'uuid', name: 'UUID 生成', icon: '#', route: '/uuid', desc: '生成随机 UUID' },
]
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div class="max-w-4xl mx-auto px-6 py-8 space-y-8">

      <div class="text-center py-6">
        <div class="inline-flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            D
          </div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">DevToolBox</h1>
        </div>
        <p class="text-sm text-gray-400 dark:text-gray-500">开发者工具集 / 教程下载 / PDF 合成</p>
      </div>

      <div class="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-sm">S</div>
          <div>
            <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">SaaSSY 教程下载</h2>
            <p class="text-xs text-gray-400 dark:text-gray-500">批量下载 SaaSSY 学习教程，合并为 PDF</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            @click="router.push('/saasyy-downloader')"
            class="group relative p-5 rounded-xl border-2 border-dashed border-primary-200 dark:border-primary-800 hover:border-primary-500 dark:hover:border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left"
          >
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                1
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">下载教程脚本</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  填写认证信息，解析目录结构，勾选需要的内容，一键生成下载脚本
                </p>
                <div class="mt-3 flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 font-medium">
                  <span>→ 去下载脚本</span>
                  <svg class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </div>
          </button>

          <button
            @click="router.push('/saasyy-pdf-converter')"
            class="group relative p-5 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left"
          >
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                2
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">合并为 PDF</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  下载 PDF 合成脚本到本地，将下载好的教程目录一键合成为单一 PDF 文档
                </p>
                <div class="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>→ 去合并 PDF</span>
                  <svg class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div class="mt-5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
          <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span class="px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium">1. 填信息</span>
            <svg class="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <span class="px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium">2. 勾选内容</span>
            <svg class="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <span class="px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium">3. 生成脚本</span>
            <svg class="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <span class="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">4. 运行下载</span>
            <svg class="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <span class="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">5. 合并 PDF</span>
          </div>
          <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">提示：首次使用请先准备好 Cookie、AccessProfile 和目录 JSON（F12 → Network 获取）</p>
        </div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">其他工具</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            v-for="tool in quickTools"
            :key="tool.id"
            @click="router.push(tool.route)"
            class="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all text-left group"
          >
            <div
              class="w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:scale-105 transition-transform"
              :class="tool.color"
            >
              {{ tool.icon }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ tool.name }}</p>
              <p class="text-[11px] text-gray-400 dark:text-gray-500 truncate">{{ tool.desc }}</p>
            </div>
          </button>
        </div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">即将上线</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            v-for="tool in disabledTools"
            :key="tool.id"
            class="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed"
          >
            <div class="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-sm font-mono font-bold">
              {{ tool.icon }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-500">{{ tool.name }}</p>
              <p class="text-[11px] text-gray-400 dark:text-gray-600 truncate">{{ tool.desc }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
