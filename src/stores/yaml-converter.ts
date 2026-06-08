import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as jsYaml from 'js-yaml'

export const useYamlConverterStore = defineStore('yamlConverter', () => {
  const yamlContent = ref('')
  const jsonContent = ref('')
  const activeSide = ref<'yaml' | 'json'>('yaml')
  const yamlValid = ref(true)
  const jsonValid = ref(true)
  const errorMessage = ref('')
  const errorSide = ref<'yaml' | 'json' | null>(null)
  const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  const hasError = computed(() => !!errorMessage.value)

  const yamlLineCount = computed(() => yamlContent.value.split('\n').length)
  const yamlCharCount = computed(() => yamlContent.value.length)
  const jsonLineCount = computed(() => jsonContent.value.split('\n').length)
  const jsonCharCount = computed(() => jsonContent.value.length)

  function debouncedConvert(action: () => void) {
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
    }
    debounceTimer.value = setTimeout(() => {
      action()
    }, 500)
  }

  function yamlToJson() {
    const trimmed = yamlContent.value.trim()
    if (!trimmed) {
      if (jsonContent.value !== '') jsonContent.value = ''
      jsonValid.value = true
      errorMessage.value = ''
      errorSide.value = null
      return
    }
    try {
      const parsed = jsYaml.load(trimmed)
      const newJson = JSON.stringify(parsed, null, 2)
      if (newJson !== jsonContent.value) {
        jsonContent.value = newJson
      }
      jsonValid.value = true
      errorMessage.value = ''
      errorSide.value = null
    } catch (e: any) {
      jsonValid.value = false
      errorMessage.value = 'YAML 解析错误: ' + e.message
      errorSide.value = 'yaml'
    }
  }

  function jsonToYaml() {
    const trimmed = jsonContent.value.trim()
    if (!trimmed) {
      if (yamlContent.value !== '') yamlContent.value = ''
      yamlValid.value = true
      errorMessage.value = ''
      errorSide.value = null
      return
    }
    try {
      const parsed = JSON.parse(trimmed)
      const newYaml = jsYaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      })
      if (newYaml !== yamlContent.value) {
        yamlContent.value = newYaml
      }
      yamlValid.value = true
      errorMessage.value = ''
      errorSide.value = null
    } catch (e: any) {
      yamlValid.value = false
      errorMessage.value = 'JSON 解析错误: ' + e.message
      errorSide.value = 'json'
    }
  }

  function onYamlChange(value: string) {
    yamlContent.value = value
    activeSide.value = 'yaml'
    debouncedConvert(yamlToJson)
  }

  function onJsonChange(value: string) {
    jsonContent.value = value
    activeSide.value = 'json'
    debouncedConvert(jsonToYaml)
  }

  function flushYamlToJson() {
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
      debounceTimer.value = null
    }
    yamlToJson()
  }

  function flushJsonToYaml() {
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
      debounceTimer.value = null
    }
    jsonToYaml()
  }

  return {
    yamlContent,
    jsonContent,
    activeSide,
    yamlValid,
    jsonValid,
    errorMessage,
    errorSide,
    hasError,
    yamlLineCount,
    yamlCharCount,
    jsonLineCount,
    jsonCharCount,
    onYamlChange,
    onJsonChange,
    flushYamlToJson,
    flushJsonToYaml,
  }
})
