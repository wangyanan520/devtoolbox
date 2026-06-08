import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: number
  type: ToastType
  title: string
  message: string
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

export function useToast() {
  function show(title: string, message: string, type: ToastType = 'info', duration = 3000) {
    const id = ++nextId
    toasts.value.push({ id, type, title, message })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  function success(title: string, message = '') { show(title, message, 'success') }
  function error(title: string, message = '') { show(title, message, 'error') }
  function info(title: string, message = '') { show(title, message, 'info') }
  function warning(title: string, message = '') { show(title, message, 'warning') }

  return { toasts, show, success, error, info, warning }
}
