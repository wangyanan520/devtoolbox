<script setup lang="ts">
import { useSaasyyDownloaderStore } from '@/stores/saasyy-downloader'
import CatalogTreeNode from './CatalogTreeNode.vue'
import CatalogStatsBar from './CatalogStatsBar.vue'

const store = useSaasyyDownloaderStore()

const emit = defineEmits<{
  reparse: []
}>()

function handleToggle(uiId: string) {
  store.toggleNode(uiId)
}

function handleSelectAll() {
  store.selectAll()
}

function handleDeselectAll() {
  store.deselectAll()
}
</script>

<template>
  <div class="h-full flex flex-col">
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
      <button
        @click="emit('reparse')"
        class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        重新解析
      </button>
    </div>

    <div class="flex-1 overflow-y-auto border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2">
      <div v-if="store.treeData.length === 0" class="flex items-center justify-center h-32 text-xs text-gray-400">
        暂无数据，请先粘贴并解析目录 JSON
      </div>
      <CatalogTreeNode
        v-for="(node, index) in store.treeData"
        :key="node.uiId"
        :node="node"
        :number-label="String(index + 1).padStart(2, '0')"
        @toggle="handleToggle"
      />
    </div>

    <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
      <CatalogStatsBar :stats="store.stats" />
    </div>
  </div>
</template>
