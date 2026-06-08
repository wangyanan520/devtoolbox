<script setup lang="ts">
import { ref, computed } from 'vue'
import { useJsonEditorStore } from '@/stores/json-editor'
import { getTypeColor } from '@/utils/json'

const jsonStore = useJsonEditorStore()

interface FormField {
  path: string
  key: string
  type: string
  value: any
  depth: number
  isExpandable: boolean
  expanded: boolean
  isArray: boolean
}

const expandedObjects = ref<Set<string>>(new Set())

const formFields = computed(() => {
  const result: FormField[] = []
  if (!jsonStore.parsedData) return result

  function walk(data: any, path: string, depth: number, key: string) {
    if (data === null) {
      result.push({ path, key, type: 'null', value: null, depth, isExpandable: false, expanded: false, isArray: false })
      return
    }

    const type = Array.isArray(data) ? 'array' : typeof data

    if (type === 'object' || type === 'array') {
      const isArr = type === 'array'
      const entries = Object.entries(data)
      const isExpanded = expandedObjects.value.has(path) || depth < 1

      result.push({
        path, key: isArr ? `${key} [${entries.length}]` : key,
        type, value: data, depth,
        isExpandable: true,
        expanded: isExpanded,
        isArray: isArr,
      })

      if (isExpanded) {
        entries.forEach(([k, v]) => {
          const childPath = isArr ? `${path}[${k}]` : `${path}.${k}`
          walk(v, childPath, depth + 1, isArr ? `[${k}]` : k)
        })
      }
    } else {
      result.push({ path, key, type, value: data, depth, isExpandable: false, expanded: false, isArray: false })
    }
  }

  walk(jsonStore.parsedData, '$', 0, 'root')
  return result
})

function toggleExpand(path: string) {
  if (expandedObjects.value.has(path)) {
    expandedObjects.value.delete(path)
  } else {
    expandedObjects.value.add(path)
  }
}

function updateValue(field: FormField, newValue: string) {
  if (!jsonStore.parsedData) return
  const data = jsonStore.parsedData
  const parts = field.path.replace(/^\$\.?/, '').split(/\.|(?=\[)/).filter(Boolean)
  let current = data
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (part.startsWith('[')) {
      current = current[parseInt(part.slice(1, -1))]
    } else {
      current = current[part]
    }
  }
  const lastPart = parts[parts.length - 1]
  if (lastPart.startsWith('[')) {
    const idx = parseInt(lastPart.slice(1, -1))
    current[idx] = convertValue(newValue, field.type)
  } else {
    current[lastPart] = convertValue(newValue, field.type)
  }
  jsonStore.setContent(JSON.stringify(data, null, 2))
}

function convertValue(val: string, type: string): any {
  if (type === 'number') {
    const n = Number(val)
    return isNaN(n) ? 0 : n
  }
  if (type === 'boolean') return val === 'true'
  if (type === 'null') return null
  return val
}

function deleteField(field: FormField) {
  if (!jsonStore.parsedData || field.depth === 0) return
  const data = jsonStore.parsedData
  const parts = field.path.replace(/^\$\.?/, '').split(/\.|(?=\[)/).filter(Boolean)
  let current = data
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (part.startsWith('[')) {
      current = current[parseInt(part.slice(1, -1))]
    } else {
      current = current[part]
    }
  }
  const lastPart = parts[parts.length - 1]
  if (lastPart.startsWith('[')) {
    current.splice(parseInt(lastPart.slice(1, -1)), 1)
  } else {
    delete current[lastPart]
  }
  jsonStore.setContent(JSON.stringify(data, null, 2))
}

function addNewField(parentPath: string) {
  if (!jsonStore.parsedData) return
  const data = jsonStore.parsedData
  const parts = parentPath === '$' ? [] : parentPath.replace(/^\$\.?/, '').split(/\.|(?=\[)/).filter(Boolean)
  let current: any = data
  for (const part of parts) {
    if (part.startsWith('[')) {
      current = current[parseInt(part.slice(1, -1))]
    } else {
      current = current[part]
    }
  }
  if (typeof current === 'object' && !Array.isArray(current)) {
    const baseName = 'newKey'
    let name = baseName
    let counter = 1
    while (name in current) { name = `${baseName}${counter++}` }
    current[name] = ''
    jsonStore.setContent(JSON.stringify(data, null, 2))
    if (!expandedObjects.value.has(parentPath)) {
      expandedObjects.value.add(parentPath)
    }
  }
}

function addArrayItem(parentPath: string) {
  if (!jsonStore.parsedData) return
  const data = jsonStore.parsedData
  const parts = parentPath === '$' ? [] : parentPath.replace(/^\$\.?/, '').split(/\.|(?=\[)/).filter(Boolean)
  let current: any = data
  for (const part of parts) {
    if (part.startsWith('[')) {
      current = current[parseInt(part.slice(1, -1))]
    } else {
      current = current[part]
    }
  }
  if (Array.isArray(current)) {
    current.push('')
    jsonStore.setContent(JSON.stringify(data, null, 2))
    if (!expandedObjects.value.has(parentPath)) {
      expandedObjects.value.add(parentPath)
    }
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto p-3">
    <div v-if="formFields.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
      <svg class="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <span class="text-xs">输入有效的 JSON 后显示表单</span>
    </div>

    <div v-else class="space-y-1">
      <div
        v-for="field in formFields"
        :key="field.path"
        class="rounded-lg transition-all duration-150"
        :class="[field.depth > 0 ? 'border-l-2 border-gray-100 dark:border-gray-700/50 ml-2 pl-2' : 'border-l-2 border-transparent pl-2']"
      >
        <!-- object/array 头部 -->
        <div
          v-if="field.isExpandable"
          class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors"
        >
          <button class="flex items-center gap-1 flex-1 text-left" @click="toggleExpand(field.path)">
            <svg
              class="w-3.5 h-3.5 text-gray-400 transition-transform duration-150 flex-shrink-0"
              :class="{ 'rotate-90': field.expanded }"
              fill="currentColor" viewBox="0 0 20 20"
            >
              <path d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"/>
            </svg>
            <span class="font-medium text-sm text-gray-700 dark:text-gray-300 truncate">{{ field.key }}</span>
            <span
              class="px-1.5 rounded text-[10px] font-medium flex-shrink-0"
              :style="{ color: getTypeColor(field.type), backgroundColor: getTypeColor(field.type) + '15' }"
            >
              {{ field.isArray ? 'array[' + (field.value as any[]).length + ']' : 'object{' + Object.keys(field.value).length + '}' }}
            </span>
          </button>

          <!-- 添加按钮 -->
          <button
            class="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all flex-shrink-0"
            :title="field.isArray ? '添加数组项' : '添加属性'"
            @click="field.isArray ? addArrayItem(field.path) : addNewField(field.path)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>

        <!-- 叶子节点 - 可编辑 -->
        <div
          v-else
          class="flex items-center gap-2 px-2 py-1.5 rounded-lg group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
          :style="{ paddingLeft: `${field.depth * 12 + 8}px` }"
        >
          <span class="text-sm text-gray-600 dark:text-gray-400 font-medium flex-shrink-0 min-w-[60px] truncate">{{ field.key }}:</span>

          <!-- string -->
          <input
            v-if="field.type === 'string'"
            :value="field.value"
            @change="(e: any) => updateValue(field, e.target.value)"
            class="flex-1 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none text-sm font-mono transition-all"
            :style="{ borderLeftColor: getTypeColor(field.type), borderLeftWidth: '3px' }"
          />

          <!-- number -->
          <input
            v-else-if="field.type === 'number'"
            :value="field.value"
            type="number"
            @change="(e: any) => updateValue(field, e.target.value)"
            class="flex-1 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none text-sm font-mono transition-all"
            :style="{ borderLeftColor: getTypeColor(field.type), borderLeftWidth: '3px' }"
          />

          <!-- boolean -->
          <select
            v-else-if="field.type === 'boolean'"
            :value="String(field.value)"
            @change="(e: any) => updateValue(field, e.target.value)"
            class="flex-1 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none text-sm transition-all"
            :style="{ borderLeftColor: getTypeColor(field.type), borderLeftWidth: '3px' }"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>

          <!-- null -->
          <span v-else-if="field.type === 'null'" class="flex-1 text-sm text-gray-400 italic">null</span>

          <!-- 删除按钮 -->
          <button
            v-if="field.depth > 0"
            class="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
            title="删除"
            @click="deleteField(field)"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
