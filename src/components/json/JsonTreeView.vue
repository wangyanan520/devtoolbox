<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useJsonEditorStore } from '@/stores/json-editor'
import { getTypeColor, getTypeLabel } from '@/utils/json'

const jsonStore = useJsonEditorStore()

const expanded = ref<Set<string>>(new Set(['$']))

interface FlatNode {
  key: string
  path: string
  type: string
  value: any
  depth: number
  hasChildren: boolean
  isArray: boolean
  index: number
}

const flatNodes = computed(() => {
  const result: FlatNode[] = []
  if (!jsonStore.parsedData) return result

  function walk(data: any, path: string, depth: number, key: string, parentIsArray: boolean, index: number) {
    if (data === null) {
      result.push({ key, path, type: 'null', value: null, depth, hasChildren: false, isArray: false, index })
      return
    }

    const type = Array.isArray(data) ? 'array' : typeof data

    if (type === 'object' || type === 'array') {
      const entries = type === 'array' ? Object.entries(data) : Object.entries(data)
      const isArr = type === 'array'
      result.push({
        key: isArr ? `${key} [${entries.length}]` : key,
        path,
        type,
        value: data,
        depth,
        hasChildren: entries.length > 0,
        isArray: isArr,
        index,
      })

      if (expanded.value.has(path)) {
        entries.forEach(([k, v], i) => {
          const childPath = isArr ? `${path}[${k}]` : `${path}.${k}`
          walk(v, childPath, depth + 1, isArr ? `[${k}]` : k, isArr, i)
        })
      }
    } else {
      result.push({ key, path, type, value: data, depth, hasChildren: false, isArray: false, index })
    }
  }

  walk(jsonStore.parsedData, '$', 0, 'root', false, 0)
  return result
})

function toggle(path: string) {
  if (expanded.value.has(path)) {
    expanded.value.delete(path)
  } else {
    expanded.value.add(path)
  }
}

function formatValue(node: FlatNode): string {
  if (node.type === 'string') return `"${String(node.value)}"`
  if (node.type === 'null') return 'null'
  return String(node.value)
}

function selectNode(path: string) {
  const node = flatNodes.value.find(n => n.path === path)
  if (!node || !node.hasChildren) return
  toggle(path)
}
</script>

<template>
  <div class="h-full overflow-y-auto p-2 font-mono text-sm">
    <div v-if="flatNodes.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
      <svg class="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
      </svg>
      <span class="text-xs">输入 JSON 后显示树状结构</span>
    </div>

    <div v-else class="space-y-0.5">
      <div
        v-for="(node, i) in flatNodes"
        :key="node.path"
        class="flex items-center gap-1 px-1 py-0.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
        :class="{ 'text-xs': node.depth > 0 }"
        :style="{ paddingLeft: `${node.depth * 18 + 4}px` }"
        @click="selectNode(node.path)"
      >
        <!-- 展开/折叠箭头 -->
        <button
          v-if="node.hasChildren"
          class="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          @click.stop="toggle(node.path)"
        >
          <svg
            class="w-3 h-3 transition-transform duration-150"
            :class="{ 'rotate-90': expanded.has(node.path) }"
            fill="currentColor" viewBox="0 0 20 20"
          >
            <path d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"/>
          </svg>
        </button>
        <span v-else class="w-4 flex-shrink-0"></span>

        <!-- 数组索引标记 -->
        <span v-if="node.isArray" class="text-gray-400 dark:text-gray-500 text-[10px] w-5 text-right flex-shrink-0">{{ node.index }}</span>

        <!-- 键名 -->
        <span class="text-gray-700 dark:text-gray-300 font-medium flex-shrink-0">{{ node.key }}</span>

        <!-- 分隔符 -->
        <span v-if="!node.hasChildren && node.depth > 0" class="text-gray-400 dark:text-gray-500 mx-0.5">:</span>

        <!-- 类型标签 -->
        <span
          v-if="node.hasChildren"
          class="px-1 rounded text-[10px] font-medium flex-shrink-0"
          :style="{ color: getTypeColor(node.type), backgroundColor: getTypeColor(node.type) + '15' }"
        >
          {{ getTypeLabel(node.type) }}
        </span>

        <!-- 值 -->
        <span
          v-if="!node.hasChildren"
          class="truncate"
          :style="{ color: getTypeColor(node.type) }"
        >
          {{ formatValue(node) }}
        </span>

        <!-- 子节点计数（对 object/array 在折叠状态下） -->
        <span
          v-if="node.hasChildren && !expanded.has(node.path)"
          class="text-gray-400 dark:text-gray-500 text-[10px] ml-auto"
        >
          {{ node.isArray ? `${(node.value as any[]).length} 项` : `${Object.keys(node.value).length} 个属性` }}
        </span>
      </div>
    </div>
  </div>
</template>
