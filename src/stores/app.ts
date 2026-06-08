import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  const theme = ref<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  )
  const sidebarCollapsed = ref(false)
  const rightPanelWidth = ref(320)

  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', theme.value)
    applyTheme()
  }

  function applyTheme() {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setRightPanelWidth(width: number) {
    rightPanelWidth.value = Math.max(260, Math.min(600, width))
  }

  return {
    theme,
    sidebarCollapsed,
    rightPanelWidth,
    isDark,
    toggleTheme,
    applyTheme,
    toggleSidebar,
    setRightPanelWidth,
  }
})
