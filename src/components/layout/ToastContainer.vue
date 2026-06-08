<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()

const iconMap = {
  success: 'check-circle',
  error: 'x-circle',
  info: 'info',
  warning: 'alert-triangle',
}

const colorMap = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-500 dark:text-green-400',
    title: 'text-green-800 dark:text-green-300',
    msg: 'text-green-700 dark:text-green-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500 dark:text-red-400',
    title: 'text-red-800 dark:text-red-300',
    msg: 'text-red-700 dark:text-red-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-300',
    msg: 'text-blue-700 dark:text-blue-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500 dark:text-amber-400',
    title: 'text-amber-800 dark:text-amber-300',
    msg: 'text-amber-700 dark:text-amber-400',
  },
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md min-w-[320px] max-w-[420px] transition-all"
          :class="[colorMap[toast.type].bg, colorMap[toast.type].border]"
        >
          <!-- success icon -->
          <svg v-if="toast.type === 'success'" class="w-5 h-5 flex-shrink-0 mt-0.5" :class="colorMap[toast.type].icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <!-- error icon -->
          <svg v-else-if="toast.type === 'error'" class="w-5 h-5 flex-shrink-0 mt-0.5" :class="colorMap[toast.type].icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <!-- info icon -->
          <svg v-else-if="toast.type === 'info'" class="w-5 h-5 flex-shrink-0 mt-0.5" :class="colorMap[toast.type].icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <!-- warning icon -->
          <svg v-else class="w-5 h-5 flex-shrink-0 mt-0.5" :class="colorMap[toast.type].icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold" :class="colorMap[toast.type].title">{{ toast.title }}</p>
            <p v-if="toast.message" class="text-xs mt-0.5" :class="colorMap[toast.type].msg">{{ toast.message }}</p>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
