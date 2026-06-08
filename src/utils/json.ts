import type { JsonPathNode } from '@/types'

export function parseToTree(data: any, path = '$'): JsonPathNode[] {
  if (data === null) {
    return [{ key: path, type: 'null', value: null, path }]
  }

  const type = Array.isArray(data) ? 'array' : typeof data

  if (type !== 'object' && type !== 'array') {
    return [{ key: path, type: type as any, value: data, path }]
  }

  const children: JsonPathNode[] = []
  const entries = Array.isArray(data) ? data.entries() : Object.entries(data)

  for (const [key, value] of entries) {
    const childPath = Array.isArray(data) ? `${path}[${key}]` : `${path}.${key}`
    const childType = Array.isArray(value) ? 'array' : typeof value

    if (value === null) {
      children.push({ key: String(key), type: 'null', value: null, path: childPath })
    } else if (childType === 'object' || childType === 'array') {
      const grandChildren = parseToTree(value, childPath)
      children.push({
        key: String(key),
        type: childType as any,
        value,
        path: childPath,
        children: grandChildren,
      })
    } else {
      children.push({
        key: String(key),
        type: childType as any,
        value,
        path: childPath,
      })
    }
  }

  return children
}

export function getValueByPath(data: any, path: string): any {
  if (path === '$') return data
  const parts = path.replace(/^\$\.?/, '').split(/\.|(?=\[)/)
  let current = data
  for (const part of parts) {
    if (!part) continue
    if (part.startsWith('[')) {
      const idx = parseInt(part.slice(1, -1))
      current = current[idx]
    } else {
      current = current[part]
    }
  }
  return current
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    string: '#10b981',
    number: '#3b82f6',
    boolean: '#f59e0b',
    null: '#6b7280',
    array: '#8b5cf6',
    object: '#f97316',
  }
  return map[type] || '#6b7280'
}

export function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    null: 'null',
    array: 'array[]',
    object: 'object{}',
  }
  return map[type] || type
}
