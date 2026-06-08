<script setup lang="ts">
import { ref, computed } from 'vue'
import { useJsonEditorStore } from '@/stores/json-editor'
import { parseToTree, getValueByPath, getTypeColor } from '@/utils/json'
import type { JsonPathNode } from '@/types'

const emit = defineEmits<{
  (e: 'nodeSelected', path: string): void
}>()

const jsonStore = useJsonEditorStore()
const expandedKeys = ref<Set<string>>(new Set(['$']))

const treeData = computed(() => {
  if (!jsonStore.parsedData) return []
  return parseToTree(jsonStore.parsedData)
})

function toggleExpand(path: string) {
  if (expandedKeys.value.has(path)) {
    expandedKeys.value.delete(path)
  } else {
    expandedKeys.value.add(path)
  }
}

function isExpanded(path: string) {
  return expandedKeys.value.has(path)
}

function handleNodeClick(node: JsonPathNode) {
  emit('nodeSelected', node.path)
}

function getSummary(node: JsonPathNode): string {
  if (node.type === 'array') {
    return `[${node.value?.length ?? 0} 项]`
  }
  if (node.type === 'object') {
    const keys = Object.keys(node.value ?? {})
    return `{${keys.length} 个属性}`
  }
  if (node.type === 'string') {
    return `"${String(node.value).substring(0, 30)}${String(node.value).length > 30 ? '...' : ''}"`
  }
  return String(node.value)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700/50">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">结构大纲</h3>
      <span class="text-xs text-gray-400">
        {{ jsonStore.nodeCount }} 个节点 · 深度 {{ jsonStore.depth }}
      </span>
    </div>

    <div class="flex-1 overflow-y-auto p-2">
      <div v-if="!jsonStore.parsedData" class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <svg class="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <span class="text-xs">输入 JSON 后显示结构</span>
      </div>

      <div v-else class="space-y-0.5 font-mono text-xs">
        <template v-for="node in treeData" :key="node.path">
          <div
            class="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            @click="handleNodeClick(node)"
          >
            <button
              v-if="node.children"
              class="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              @click.stop="toggleExpand(node.path)"
            >
              <svg
                class="w-3 h-3 transition-transform duration-150"
                :class="{ 'rotate-90': isExpanded(node.path) }"
                fill="currentColor" viewBox="0 0 20 20"
              >
                <path d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"/>
              </svg>
            </button>
            <span v-else class="w-4 flex-shrink-0"></span>
            <span class="text-gray-600 dark:text-gray-400">{{ node.key }}</span>
            <span
              class="px-1 rounded text-[10px] font-medium"
              :style="{ color: getTypeColor(node.type), backgroundColor: getTypeColor(node.type) + '15' }"
            >
              {{ node.type }}
            </span>
            <span v-if="!node.children" class="text-gray-400 dark:text-gray-500 truncate ml-auto">
              {{ getSummary(node) }}
            </span>
          </div>

          <template v-if="node.children && isExpanded(node.path)">
            <div
              v-for="child in node.children"
              :key="child.path"
              class="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ml-4 border-l-2 border-gray-100 dark:border-gray-700/50"
              @click="handleNodeClick(child)"
            >
              <button
                v-if="child.children"
                class="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                @click.stop="toggleExpand(child.path)"
              >
                <svg
                  class="w-3 h-3 transition-transform duration-150"
                  :class="{ 'rotate-90': isExpanded(child.path) }"
                  fill="currentColor" viewBox="0 0 20 20"
                >
                  <path d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"/>
                </svg>
              </button>
              <span v-else class="w-4 flex-shrink-0"></span>
              <span class="text-gray-600 dark:text-gray-400">{{ child.key }}</span>
              <span
                class="px-1 rounded text-[10px] font-medium"
                :style="{ color: getTypeColor(child.type), backgroundColor: getTypeColor(child.type) + '15' }"
              >
                {{ child.type }}
              </span>
              <span v-if="!child.children" class="text-gray-400 dark:text-gray-500 truncate ml-auto">
                {{ getSummary(child) }}
              </span>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>
