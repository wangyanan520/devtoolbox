<script setup lang="ts">
import type { CatalogStats } from '@/types'

defineProps<{
  stats: CatalogStats
}>()
</script>

<template>
  <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
    <span class="flex items-center gap-1">
      <span>[DIR]</span>
      <span>{{ stats.totalDirs }} 目录</span>
    </span>
    <span class="text-gray-300 dark:text-gray-600">|</span>
    <span class="flex items-center gap-1">
      <span>[HTM]</span>
      <span>{{ stats.totalArticles }} 图文</span>
    </span>
    <span class="text-gray-300 dark:text-gray-600">|</span>
    <span class="flex items-center gap-1">
      <span>[MP4]</span>
      <span>{{ stats.totalVideos }} 视频</span>
    </span>
  </div>
</template>
