export interface ToolItem {
  id: string
  name: string
  description: string
  icon: string
  route: string
  category: ToolCategory
}

export type ToolCategory = 'json' | 'text' | 'code' | 'image' | 'network' | 'other'

export interface JsonPathNode {
  key: string
  type: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'
  value: any
  path: string
  children?: JsonPathNode[]
  size?: number
}

export interface SearchMatch {
  line: number
  column: number
  length: number
  text: string
}

export interface EditorPosition {
  lineNumber: number
  column: number
}
