<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import ToastContainer from '@/components/layout/ToastContainer.vue'

const appStore = useAppStore()

onMounted(() => {
  appStore.applyTheme()
})
</script>

<template>
  <div
    class="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300"
  >
    <AppHeader />
    <div class="flex-1 flex overflow-hidden">
      <AppSidebar />
      <main class="flex-1 overflow-hidden">
        <router-view />
      </main>
    </div>
    <ToastContainer />
  </div>
</template>
