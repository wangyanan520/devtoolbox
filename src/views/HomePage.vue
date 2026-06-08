<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const tools = [
  { id: 'json', name: 'JSON 编辑器', icon: '{}', route: '/json', desc: '格式化、编辑、验证 JSON 数据', color: 'from-blue-500 to-blue-600' },
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
        <p class="text-sm text-gray-400 dark:text-gray-500">开发者工具箱</p>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">工具</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            v-for="tool in tools"
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

    </div>
  </div>
</template>
