import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useJsonEditorStore = defineStore('jsonEditor', () => {
  const content = ref('')
  const isValid = ref(true)
  const errorMessage = ref('')
  const parsedData = ref<any>(null)
  const lineCount = ref(1)
  const charCount = ref(0)
  const nodeCount = ref(0)
  const depth = ref(0)

  const statusText = computed(() => {
    if (!content.value.trim()) return '编辑器为空'
    if (isValid.value) return 'JSON 格式有效'
    return `JSON 格式无效: ${errorMessage.value}`
  })

  const statusType = computed(() => {
    if (!content.value.trim()) return 'info'
    if (isValid.value) return 'success'
    return 'error'
  })

  function updateContent(val: string) {
    content.value = val
    charCount.value = val.length
    lineCount.value = val.split('\n').length
    validate()
  }

  function validate(): boolean {
    try {
      const trimmed = content.value.trim()
      if (!trimmed) {
        isValid.value = true
        errorMessage.value = ''
        parsedData.value = null
        nodeCount.value = 0
        depth.value = 0
        return true
      }
      parsedData.value = JSON.parse(trimmed)
      isValid.value = true
      errorMessage.value = ''
      calculateStats(parsedData.value)
      return true
    } catch (e: any) {
      isValid.value = false
      errorMessage.value = e.message
      parsedData.value = null
      nodeCount.value = 0
      depth.value = 0
      return false
    }
  }

  function calculateStats(data: any, currentDepth = 0) {
    depth.value = Math.max(depth.value, currentDepth)
    if (data === null || typeof data !== 'object') {
      nodeCount.value++
      return
    }
    if (Array.isArray(data)) {
      nodeCount.value++
      for (const item of data) {
        calculateStats(item, currentDepth + 1)
      }
    } else {
      nodeCount.value++
      for (const key in data) {
        calculateStats(data[key], currentDepth + 1)
      }
    }
  }

  function format(indent: number = 2) {
    if (!parsedData.value) return
    content.value = JSON.stringify(parsedData.value, null, indent)
    charCount.value = content.value.length
    lineCount.value = content.value.split('\n').length
  }

  function compact() {
    if (!parsedData.value) return
    content.value = JSON.stringify(parsedData.value)
    charCount.value = content.value.length
    lineCount.value = 1
  }

  function setContent(val: string) {
    content.value = val
    updateContent(val)
  }

  return {
    content,
    isValid,
    errorMessage,
    parsedData,
    lineCount,
    charCount,
    nodeCount,
    depth,
    statusText,
    statusType,
    updateContent,
    validate,
    format,
    compact,
    setContent,
  }
})
