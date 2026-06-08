<script setup lang="ts">
import type { TreeNode } from '@/types'

defineOptions({ name: 'CatalogTreeNode' })

const props = defineProps<{
  node: TreeNode
  depth?: number
  numberLabel?: string
}>()

const emit = defineEmits<{
  toggle: [uiId: string]
}>()

const indent = props.depth ?? 0

function getTypeIcon(node: TreeNode): string {
  if (node.contentType === 0) return '[DIR]'
  if (node.contentType === 1) return '[HTM]'
  return '[MP4]'
}

function getTypeClass(node: TreeNode): string {
  if (node.contentType === 1) return 'text-blue-600 dark:text-blue-400'
  if (node.contentType === 2) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

function toggleExpand() {
  const n = props.node
  if (n.uiChildren?.length) {
    n.expanded = !n.expanded
  }
}

function onCheckboxClick(e: MouseEvent) {
  e.stopPropagation()
  emit('toggle', props.node.uiId)
}

function formatNumber(num: number): string {
  return String(num).padStart(2, '0')
}
</script>

<template>
  <div>
    <div
      class="flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
      :style="{ paddingLeft: `${12 + indent * 20}px` }"
      @click="toggleExpand"
    >
      <span
        v-if="node.uiChildren?.length"
        class="w-4 h-4 flex items-center justify-center text-gray-400 transition-transform"
        :class="{ 'rotate-90': node.expanded }"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </span>
      <span v-else class="w-4"></span>

      <label class="flex items-center gap-1 cursor-pointer" @click.stop>
        <input
          type="checkbox"
          :checked="node.checked"
          :indeterminate="node.indeterminate"
          @click="onCheckboxClick"
          class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-400/40 cursor-pointer"
        />
      </label>

      <span class="text-xs text-gray-400 dark:text-gray-500 font-mono mr-0.5 flex-shrink-0">{{ props.numberLabel }}</span>

      <span class="text-[10px] flex-shrink-0 font-mono" :class="getTypeClass(node)">{{ getTypeIcon(node) }}</span>

      <span class="text-xs text-gray-700 dark:text-gray-300 truncate">{{ node.title }}</span>

      <span
        v-if="node.contentType === 1"
        class="ml-auto text-[10px] px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400"
      >图文</span>
      <span
        v-else-if="node.contentType === 2"
        class="ml-auto text-[10px] px-1 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400"
      >视频</span>
    </div>

    <div v-if="node.expanded && node.uiChildren?.length">
      <CatalogTreeNode
        v-for="(child, index) in node.uiChildren"
        :key="child.uiId"
        :node="child"
        :depth="indent + 1"
        :number-label="formatNumber(index + 1)"
        @toggle="emit('toggle', $event)"
      />
    </div>
  </div>
</template>
