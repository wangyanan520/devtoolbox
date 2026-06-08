<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const toolGroups = [
  {
    name: '常用',
    tools: [
      { id: 'home', name: '工作台', icon: 'H', route: '/', desc: '所有工具入口', disabled: false },
    ],
  },
  {
    name: '工具',
    tools: [
      { id: 'json', name: 'JSON 编辑器', icon: '{ }', route: '/json', desc: '编辑、格式化、验证 JSON', disabled: false },
      { id: 'base64', name: 'Base64 编解码', icon: 'B64', route: '/base64', desc: 'Base64 编码与解码', disabled: true },
      { id: 'regex', name: '正则表达式', icon: '.*', route: '/regex', desc: '正则测试与调试', disabled: true },
      { id: 'diff', name: '文本对比', icon: '<>', route: '/diff', desc: '对比两段文本差异', disabled: true },
      { id: 'timestamp', name: '时间戳转换', icon: 'T', route: '/timestamp', desc: '时间戳与日期互转', disabled: true },
      { id: 'uuid', name: 'UUID 生成', icon: '#', route: '/uuid', desc: '生成随机 UUID', disabled: true },
    ],
  },
]
</script>

<template>
  <aside
    class="flex-shrink-0 border-r border-gray-200/60 dark:border-gray-700/30 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl transition-all duration-300 overflow-y-auto"
    :class="appStore.sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-56'"
  >
    <div class="p-3 space-y-4">
      <div
        v-for="group in toolGroups"
        :key="group.name"
        class="space-y-1"
      >
        <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-2 py-1">
          {{ group.name }}
        </div>
        <button
          v-for="tool in group.tools"
          :key="tool.id"
          :disabled="tool.disabled"
          @click="!tool.disabled && router.push(tool.route)"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left group"
          :class="[
            route.path === tool.route
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              : tool.disabled
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
          ]"
        >
          <span
            class="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            :class="route.path === tool.route
              ? 'bg-primary-100 dark:bg-primary-800/40 text-primary-600 dark:text-primary-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'"
          >
            {{ tool.icon }}
          </span>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ tool.name }}</div>
            <div class="text-[11px] text-gray-400 dark:text-gray-500 truncate">{{ tool.desc }}</div>
          </div>
          <span
            v-if="tool.disabled"
            class="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 flex-shrink-0"
          >
            即将上线
          </span>
        </button>
      </div>
    </div>
  </aside>
</template>
