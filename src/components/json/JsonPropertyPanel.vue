<script setup lang="ts">
import { ref, watch } from 'vue'
import { useJsonEditorStore } from '@/stores/json-editor'
import { getValueByPath, getTypeColor, getTypeLabel, formatFileSize } from '@/utils/json'

const props = defineProps<{
  selectedPath: string | null
}>()

const jsonStore = useJsonEditorStore()

const propertyInfo = ref<{
  path: string
  type: string
  value: any
  size: number
  depth: number
  children: number
} | null>(null)

watch(() => props.selectedPath, (path) => {
  if (!path || !jsonStore.parsedData) {
    propertyInfo.value = null
    return
  }
  try {
    const value = getValueByPath(jsonStore.parsedData, path)
    const type = Array.isArray(value) ? 'array' : typeof value
    const resolvedType = type === 'object' && value === null ? 'null' : type
    const byteSize = new TextEncoder().encode(JSON.stringify(value)).length
    const children = resolvedType === 'object' ? Object.keys(value).length : resolvedType === 'array' ? value.length : 0
    const pathDepth = path === '$' ? 0 : path.split(/\.|(?=\[)/).length

    propertyInfo.value = {
      path,
      type: resolvedType,
      value,
      size: byteSize,
      depth: pathDepth,
      children,
    }
  } catch {
    propertyInfo.value = null
  }
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700/50 flex-shrink-0">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">属性</h3>
    </div>

    <div class="flex-1 overflow-y-auto p-3">
      <div v-if="!propertyInfo" class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <svg class="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="text-xs">在结构大纲中点击节点查看属性</span>
      </div>

      <div v-else class="space-y-3">
        <!-- 路径 -->
        <div>
          <label class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">路径</label>
          <div class="mt-1 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs font-mono text-gray-600 dark:text-gray-300 break-all select-all">
            {{ propertyInfo.path }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- 类型 -->
          <div>
            <label class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">类型</label>
            <div class="mt-1">
              <span
                class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                :style="{ color: getTypeColor(propertyInfo.type), backgroundColor: getTypeColor(propertyInfo.type) + '15' }"
              >
                {{ getTypeLabel(propertyInfo.type) }}
              </span>
            </div>
          </div>

          <!-- 大小 -->
          <div>
            <label class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">大小</label>
            <div class="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300 font-mono">
              {{ formatFileSize(propertyInfo.size) }}
            </div>
          </div>

          <!-- 子节点数 -->
          <div v-if="['object', 'array'].includes(propertyInfo.type)">
            <label class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {{ propertyInfo.type === 'array' ? '数组项' : '属性数' }}
            </label>
            <div class="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300 font-mono">
              {{ propertyInfo.children }}
            </div>
          </div>

          <!-- 深度 -->
          <div>
            <label class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">深度</label>
            <div class="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300 font-mono">
              {{ propertyInfo.depth }}
            </div>
          </div>
        </div>

        <!-- 值预览（叶子节点） -->
        <div v-if="!['object', 'array'].includes(propertyInfo.type)">
          <label class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">值</label>
          <div
            class="mt-1 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm font-mono break-all max-h-32 overflow-y-auto"
            :style="{ color: getTypeColor(propertyInfo.type) }"
          >
            {{ propertyInfo.type === 'string' ? `"${propertyInfo.value}"` : String(propertyInfo.value) }}
          </div>
        </div>

        <!-- 预览 (object/array) -->
        <div v-else>
          <label class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">预览</label>
          <pre
            class="mt-1 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs font-mono text-gray-600 dark:text-gray-300 overflow-x-auto max-h-64 overflow-y-auto"
          ><code>{{ JSON.stringify(propertyInfo.value, null, 2).substring(0, 1000) }}{{ JSON.stringify(propertyInfo.value, null, 2).length > 1000 ? '...' : '' }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
