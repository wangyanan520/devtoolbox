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

// ====== SaaSSY 下载器 ======

export interface CatalogNode {
  id: number
  title: string
  contentType: 0 | 1 | 2
  videoPath?: string
  children?: CatalogNode[]
}

export interface CatalogResponse {
  status: boolean
  error: string
  list: CatalogNode[]
}

export interface TreeNode extends CatalogNode {
  uiId: string
  checked: boolean
  indeterminate: boolean
  expanded: boolean
  uiChildren?: TreeNode[]
}

export interface AuthConfig {
  cookie: string
  accessProfile: string
}

export interface CatalogStats {
  totalDirs: number
  totalArticles: number
  totalVideos: number
  selectedArticles: number
  selectedVideos: number
}

// ====== 通用网页抓取模式 ======

export interface GenericScrapingConfig {
  entryUrl: string
  linkSelector: string
  titleSelector: string
  contentSelector: string
  paginationSelector: string
  cookie: string
  extraHeaders: string
}

export interface ScrapedArticle {
  url: string
  title: string
  checked: boolean
  id: string
}

export interface ScrapingResult {
  articles: ScrapedArticle[]
  error: string | null
  totalCount: number
}

// ====== 语雀文档下载模式 ======

export interface YuqueConfig {
  entryUrl: string
  outputDir: string
}

export interface YuqueTocItem {
  type: 'TITLE' | 'DOC'
  title: string
  uuid: string
  url: string
  prev_uuid: string
  sibling_uuid: string
  child_uuid: string
  parent_uuid: string
  doc_id: string
  level: number
}

export interface YuqueTreeNode {
  title: string
  url: string
  type: 'TITLE' | 'DOC' | 'FOLDER'
  docId: string
  level: number
  uuid: string
  children: YuqueTreeNode[]
  checked: boolean
  indeterminate: boolean
  uiId: string
}
