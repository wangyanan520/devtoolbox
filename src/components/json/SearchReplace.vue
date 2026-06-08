<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  editor: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const show = ref(false)
const searchText = ref('')
const replaceText = ref('')
const useRegex = ref(false)
const caseSensitive = ref(false)
const matchCount = ref(0)
const currentMatch = ref(0)

let decorations: string[] = []

function getSearchValue(): string {
  if (useRegex.value) return searchText.value
  return searchText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function doSearch() {
  if (!props.editor || !searchText.value) {
    clearDecorations()
    matchCount.value = 0
    currentMatch.value = 0
    return
  }

  const model = props.editor.getModel()
  if (!model) return

  clearDecorations()

  try {
    const matches = model.findMatches(
      getSearchValue(),
      !caseSensitive.value,
      useRegex.value,
      true,
      null,
      true
    )

    matchCount.value = matches.length

    if (currentMatch.value > matchCount.value) {
      currentMatch.value = matchCount.value
    }
    if (currentMatch.value < 1) {
      currentMatch.value = 1
    }

    if (matches.length > 0) {
      decorations = props.editor.deltaDecorations([], matches.map((m: any, i: number) => ({
        range: m.range,
        options: {
          className: i === currentMatch.value - 1 ? 'search-match-current' : 'search-match',
          hoverMessage: { value: `第 ${i + 1} 个匹配` },
        },
      })))

      const target = matches[Math.min(currentMatch.value - 1, matches.length - 1)]
      if (target) {
        props.editor.revealRangeInCenter(target.range)
        props.editor.setSelection(target.range)
      }
    }
  } catch {
    matchCount.value = 0
  }
}

function clearDecorations() {
  if (props.editor) {
    decorations = props.editor.deltaDecorations(decorations, [])
  }
}

function nextMatch() {
  if (matchCount.value === 0) return
  currentMatch.value = currentMatch.value >= matchCount.value ? 1 : currentMatch.value + 1
  doSearch()
}

function prevMatch() {
  if (matchCount.value === 0) return
  currentMatch.value = currentMatch.value <= 1 ? matchCount.value : currentMatch.value - 1
  doSearch()
}

function replace() {
  if (!props.editor || matchCount.value === 0) return
  const selection = props.editor.getSelection()
  if (!selection) return
  props.editor.executeEdits('replace', [{
    range: selection,
    text: replaceText.value,
  }])
  doSearch()
}

function replaceAll() {
  if (!props.editor || matchCount.value === 0) return
  const model = props.editor.getModel()
  if (!model) return

  const fullText = model.getValue()
  const flags = useRegex.value ? 'g' : 'g'
  const regex = new RegExp(getSearchValue(), caseSensitive.value ? '' : 'i')

  let result
  if (useRegex.value) {
    const flagStr = caseSensitive.value ? 'g' : 'gi'
    result = fullText.replace(new RegExp(searchText.value, flagStr), replaceText.value)
  } else {
    result = fullText.replace(regex, replaceText.value)
  }

  props.editor.executeEdits('replace-all', [{
    range: model.getFullModelRange(),
    text: result,
  }])
  doSearch()
}

function forceSearch() {
  currentMatch.value = 1
  doSearch()
}

function close() {
  show.value = false
  searchText.value = ''
  replaceText.value = ''
  clearDecorations()
  emit('close')
}

function open(initialText?: string) {
  show.value = true
  currentMatch.value = 1
  if (initialText) {
    searchText.value = initialText
  } else if (props.editor) {
    const word = props.editor.getModel()?.getWordAtPosition(props.editor.getPosition())
    searchText.value = word?.word || ''
  }
  setTimeout(() => doSearch(), 50)
}

defineExpose({ open, close })
</script>

<template>
  <div
    v-if="show"
    class="absolute top-2 right-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 transition-all duration-200"
  >
    <div class="p-3 space-y-2">
      <!-- 搜索行 -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <input
            v-model="searchText"
            type="text"
            placeholder="搜索..."
            class="w-full px-3 py-1.5 pr-8 rounded-lg bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-primary-400 dark:focus:border-primary-500 focus:ring-1 focus:ring-primary-400 dark:focus:ring-primary-500 outline-none text-sm transition-all"
            @input="forceSearch"
            @keydown.enter="nextMatch"
            @keydown.shift.enter="prevMatch"
            @keydown.escape="close"
          />
          <div
            v-if="searchText && matchCount > 0"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono"
          >
            {{ currentMatch }}/{{ matchCount }}
          </div>
        </div>
        <div class="flex gap-1">
          <button
            class="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="上一个匹配 (Shift+Enter)"
            @click="prevMatch"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
            </svg>
          </button>
          <button
            class="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="下一个匹配 (Enter)"
            @click="nextMatch"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>
        <button
          class="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="close"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- 替换行 -->
      <div v-if="searchText && matchCount > 0" class="flex gap-2">
        <input
          v-model="replaceText"
          type="text"
          placeholder="替换为..."
          class="flex-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-primary-400 dark:focus:border-primary-500 focus:ring-1 focus:ring-primary-400 dark:focus:ring-primary-500 outline-none text-sm transition-all"
          @keydown.enter="replace"
        />
        <button
          class="px-2.5 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium transition-colors"
          @click="replace"
        >
          替换
        </button>
        <button
          class="px-2.5 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium transition-colors"
          @click="replaceAll"
        >
          全部
        </button>
      </div>

      <!-- 选项 -->
      <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <label class="flex items-center gap-1.5 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors select-none">
          <input
            v-model="useRegex"
            type="checkbox"
            class="rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500"
            @change="forceSearch"
          />
          正则
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors select-none">
          <input
            v-model="caseSensitive"
            type="checkbox"
            class="rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500"
            @change="forceSearch"
          />
          区分大小写
        </label>
        <span v-if="!searchText" class="text-gray-300 dark:text-gray-600">输入关键词搜索</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.search-match) {
  background-color: rgba(234, 179, 8, 0.25);
  border-radius: 2px;
}

:deep(.search-match-current) {
  background-color: rgba(234, 88, 12, 0.4);
  border-radius: 2px;
}
</style>
