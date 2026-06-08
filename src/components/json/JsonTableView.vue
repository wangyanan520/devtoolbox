<script setup lang="ts">
import { ref, computed } from 'vue'
import { useJsonEditorStore } from '@/stores/json-editor'

const jsonStore = useJsonEditorStore()

const sortKey = ref<string | null>(null)
const sortAsc = ref(true)
const hoveredRow = ref<number | null>(null)

type TableRow = Record<string, any>

const isTableReady = computed(() => {
  if (!jsonStore.parsedData || !Array.isArray(jsonStore.parsedData)) return false
  return jsonStore.parsedData.length > 0
})

const columns = computed(() => {
  if (!isTableReady.value) return []
  const data = jsonStore.parsedData as any[]
  const keySet = new Set<string>()
  data.forEach(item => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.keys(item).forEach(k => keySet.add(k))
    }
  })
  return Array.from(keySet)
})

const rows = computed(() => {
  if (!isTableReady.value) return []
  let data = [...jsonStore.parsedData] as any[]

  if (sortKey.value) {
    data.sort((a, b) => {
      const va = a?.[sortKey.value!]
      const vb = b?.[sortKey.value!]
      if (va === vb) return 0
      const cmp = va > vb ? 1 : -1
      return sortAsc.value ? cmp : -cmp
    })
  }

  return data.map((item, idx) => {
    const row: TableRow = {}
    columns.value.forEach(col => {
      row[col] = item?.[col]
    })
    row['__index'] = idx
    return row
  })
})

function toggleSort(col: string) {
  if (sortKey.value === col) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = col
    sortAsc.value = true
  }
}

function formatCell(val: any): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val.length > 50 ? val.substring(0, 50) + '...' : val
  if (typeof val === 'object') return JSON.stringify(val).substring(0, 60) + '...'
  return String(val)
}

function getCellTooltip(val: any): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object') return JSON.stringify(val, null, 2)
  if (typeof val === 'string' && val.length > 50) return val
  return ''
}

function getCellClass(val: any): string {
  if (val === null || val === undefined) return 'text-gray-400 dark:text-gray-500 italic'
  const t = typeof val
  if (t === 'number') return 'text-blue-600 dark:text-blue-400 font-mono'
  if (t === 'boolean') return 'text-amber-600 dark:text-amber-400 font-mono'
  if (t === 'string') return 'text-emerald-600 dark:text-emerald-400'
  if (t === 'object') return 'text-purple-600 dark:text-purple-400'
  return ''
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 提示 -->
    <div v-if="!jsonStore.parsedData" class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
      <svg class="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
      </svg>
      <span class="text-xs">输入有效的 JSON 后显示表格</span>
    </div>

    <div v-else-if="!Array.isArray(jsonStore.parsedData)" class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
      <svg class="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="text-xs">表格视图仅支持根节点为数组的 JSON 数据</span>
    </div>

    <div v-else-if="!isTableReady" class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
      <span class="text-xs">数组为空</span>
    </div>

    <!-- 表格 -->
    <template v-else>
      <div class="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700/50 text-xs text-gray-500 dark:text-gray-400">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <span>共 <strong class="text-gray-700 dark:text-gray-300">{{ rows.length }}</strong> 行 · <strong class="text-gray-700 dark:text-gray-300">{{ columns.length }}</strong> 列</span>
        <span v-if="sortKey" class="ml-auto">
          排序: <strong class="text-primary-500">{{ sortKey }}</strong>
          <span class="ml-1">{{ sortAsc ? '↑' : '↓' }}</span>
        </span>
      </div>

      <div class="flex-1 overflow-auto">
        <table class="w-full border-collapse text-xs">
          <thead class="sticky top-0 z-10">
            <tr class="bg-gray-50 dark:bg-gray-800/80">
              <th class="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap w-10">#</th>
              <th
                v-for="col in columns"
                :key="col"
                class="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors select-none"
                @click="toggleSort(col)"
              >
                <div class="flex items-center gap-1">
                  <span class="font-mono text-primary-600 dark:text-primary-400">{{ col }}</span>
                  <svg v-if="sortKey === col" class="w-3 h-3 text-primary-500 transition-transform" :class="{ 'rotate-180': !sortAsc }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                  </svg>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, ri) in rows"
              :key="ri"
              class="border-b border-gray-100 dark:border-gray-700/30 transition-colors"
              :class="hoveredRow === ri ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'"
              @mouseenter="hoveredRow = ri"
              @mouseleave="hoveredRow = null"
            >
              <td class="px-3 py-2 text-gray-400 dark:text-gray-500 text-[10px] font-mono">{{ ri + 1 }}</td>
              <td
                v-for="col in columns"
                :key="col"
                class="px-3 py-2 max-w-[250px] truncate"
                :class="getCellClass(row[col])"
                :title="getCellTooltip(row[col])"
              >
                {{ formatCell(row[col]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
