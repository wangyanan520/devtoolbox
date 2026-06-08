import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthConfig, TreeNode, CatalogStats, CatalogNode, CatalogResponse, GenericScrapingConfig, ScrapedArticle, YuqueConfig, YuqueTreeNode } from '@/types'

const STORAGE_KEY = 'saasyy-auth-config'
const GENERIC_CONFIG_KEY = 'scraping-generic-config'
const YUQUE_CONFIG_KEY = 'yuque-config'

function saveToLocal(config: AuthConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

function loadFromLocal(): AuthConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.cookie === 'string' && typeof parsed.accessProfile === 'string') {
        return parsed
      }
    }
  } catch {
  }
  return { cookie: '', accessProfile: '' }
}

function saveGenericToLocal(config: GenericScrapingConfig): void {
  localStorage.setItem(GENERIC_CONFIG_KEY, JSON.stringify(config))
}

function loadGenericFromLocal(): GenericScrapingConfig {
  try {
    const raw = localStorage.getItem(GENERIC_CONFIG_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.entryUrl === 'string') {
        return parsed
      }
    }
  } catch {
  }
  return { entryUrl: '', linkSelector: '', titleSelector: '', contentSelector: '', paginationSelector: '', cookie: '', extraHeaders: '' }
}

function saveYuqueToLocal(config: YuqueConfig): void {
  localStorage.setItem(YUQUE_CONFIG_KEY, JSON.stringify(config))
}

function loadYuqueFromLocal(): YuqueConfig {
  try {
    const raw = localStorage.getItem(YUQUE_CONFIG_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.entryUrl === 'string') {
        return parsed
      }
    }
  } catch {
  }
  return { entryUrl: '', outputDir: './Yuque知识库' }
}

function assignUiIds(node: CatalogNode): TreeNode {
  const treeNode = node as TreeNode
  treeNode.uiId = `node-${node.id}`
  treeNode.checked = false
  treeNode.indeterminate = false
  treeNode.expanded = true
  if (node.children) {
    treeNode.uiChildren = node.children.map(child => assignUiIds(child))
  }
  return treeNode
}

function findNodeById(tree: TreeNode[], uiId: string): TreeNode | null {
  for (const node of tree) {
    if (node.uiId === uiId) return node
    if (node.uiChildren) {
      const found = findNodeById(node.uiChildren, uiId)
      if (found) return found
    }
  }
  return null
}

function setChildrenChecked(node: TreeNode, checked: boolean): void {
  node.checked = checked
  node.indeterminate = false
  if (node.uiChildren) {
    for (const child of node.uiChildren) {
      setChildrenChecked(child, checked)
    }
  }
}

function updateAncestors(tree: TreeNode[], node: TreeNode): void {
  const parent = findParentNode(tree, node)
  if (!parent || !parent.uiChildren) return
  const allChecked = parent.uiChildren.every(c => c.checked)
  const anyChecked = parent.uiChildren.some(c => c.checked || c.indeterminate)
  parent.checked = allChecked
  parent.indeterminate = anyChecked && !allChecked
  updateAncestors(tree, parent)
}

function findParentNode(tree: TreeNode[], target: TreeNode): TreeNode | null {
  for (const node of tree) {
    if (node.uiChildren) {
      if (node.uiChildren.some(c => c.uiId === target.uiId)) return node
      const found = findParentNode(node.uiChildren, target)
      if (found) return found
    }
  }
  return null
}

function collectSelectedIds(nodes: TreeNode[], ids: Set<number>): void {
  for (const node of nodes) {
    if (!node.checked) continue
    if (node.contentType === 1 || node.contentType === 2) {
      ids.add(node.id)
    }
    if (node.uiChildren) {
      collectSelectedIds(node.uiChildren, ids)
    }
  }
}

function countStats(nodes: TreeNode[]): { totalDirs: number; totalArticles: number; totalVideos: number; selectedArticles: number; selectedVideos: number } {
  const stats = { totalDirs: 0, totalArticles: 0, totalVideos: 0, selectedArticles: 0, selectedVideos: 0 }
  for (const node of nodes) {
    if (node.contentType === 0) stats.totalDirs++
    else if (node.contentType === 1) {
      stats.totalArticles++
      if (node.checked) stats.selectedArticles++
    } else if (node.contentType === 2) {
      stats.totalVideos++
      if (node.checked) stats.selectedVideos++
    }
    if (node.uiChildren) {
      const childStats = countStats(node.uiChildren)
      stats.totalDirs += childStats.totalDirs
      stats.totalArticles += childStats.totalArticles
      stats.totalVideos += childStats.totalVideos
      stats.selectedArticles += childStats.selectedArticles
      stats.selectedVideos += childStats.selectedVideos
    }
  }
  return stats
}

export const useSaasyyDownloaderStore = defineStore('saasyyDownloader', () => {
  const mode = ref<'saasyy' | 'generic' | 'yuque'>('saasyy')
  const authConfig = ref<AuthConfig>(loadFromLocal())
  const rawCatalogJson = ref('')
  const treeData = ref<TreeNode[]>([])
  const selectedIds = ref<Set<number>>(new Set())
  const parseError = ref<string | null>(null)
  const isParsing = ref(false)
  const generatePdf = ref(true)

  const genericConfig = ref<GenericScrapingConfig>(loadGenericFromLocal())
  const scrapedArticles = ref<ScrapedArticle[]>([])
  const scrapingError = ref<string | null>(null)
  const isScanning = ref(false)
  const selectedArticleIds = ref<Set<string>>(new Set())

  // Yuque mode state
  const yuqueConfig = ref<YuqueConfig>(loadYuqueFromLocal())
  const yuqueTreeData = ref<YuqueTreeNode[]>([])
  const yuqueParseError = ref<string | null>(null)
  const yuqueIsParsing = ref(false)

  const stats = computed<CatalogStats>(() => {
    if (treeData.value.length === 0) {
      return { totalDirs: 0, totalArticles: 0, totalVideos: 0, selectedArticles: 0, selectedVideos: 0 }
    }
    const s = countStats(treeData.value)
    return {
      totalDirs: s.totalDirs,
      totalArticles: s.totalArticles,
      totalVideos: s.totalVideos,
      selectedArticles: s.selectedArticles,
      selectedVideos: s.selectedVideos,
    }
  })

  const isConfigValid = computed(() => {
    if (mode.value === 'saasyy') {
      return authConfig.value.cookie.trim().length > 0 && authConfig.value.accessProfile.trim().length > 0
    }
    if (mode.value === 'generic') {
      return genericConfig.value.entryUrl.trim().length > 0
        && genericConfig.value.linkSelector.trim().length > 0
        && genericConfig.value.titleSelector.trim().length > 0
        && genericConfig.value.contentSelector.trim().length > 0
    }
    return yuqueConfig.value.entryUrl.trim().length > 0
  })

  const hasSelection = computed(() => {
    if (mode.value === 'saasyy') {
      return selectedIds.value.size > 0
    }
    if (mode.value === 'generic') {
      return selectedArticleIds.value.size > 0
    }
    return getYuqueSelectedCount.value > 0
  })

  const isCatalogReady = computed(() => {
    return treeData.value.length > 0 && parseError.value === null
  })

  const genericArticleCount = computed(() => ({
    total: scrapedArticles.value.length,
    selected: selectedArticleIds.value.size,
  }))

  // Yuque computed
  const getYuqueSelectedCount = computed(() => {
    let count = 0
    function countSelected(nodes: YuqueTreeNode[]) {
      for (const node of nodes) {
        if (node.type === 'DOC' && node.checked) count++
        countSelected(node.children)
      }
    }
    countSelected(yuqueTreeData.value)
    return count
  })

  const getYuqueTotalCount = computed(() => {
    let count = 0
    function countAll(nodes: YuqueTreeNode[]) {
      for (const node of nodes) {
        if (node.type === 'DOC') count++
        countAll(node.children)
      }
    }
    countAll(yuqueTreeData.value)
    return count
  })

  function saveAuthConfig(): void {
    saveToLocal(authConfig.value)
  }

  function loadAuthConfig(): void {
    authConfig.value = loadFromLocal()
  }

  function parseCatalog(): boolean {
    parseError.value = null
    isParsing.value = true
    selectedIds.value = new Set()

    try {
      const raw = rawCatalogJson.value.trim()
      if (!raw) {
        parseError.value = '请输入目录 JSON'
        isParsing.value = false
        return false
      }

      let parsed: any
      try {
        parsed = JSON.parse(raw)
      } catch {
        parseError.value = 'JSON 格式错误，请检查输入的 JSON 是否合法'
        isParsing.value = false
        return false
      }

      const response = parsed as CatalogResponse
      if (response.status !== true || !Array.isArray(response.list)) {
        parseError.value = '目录数据异常，请确认 JSON 包含 status=true 和 list 数组'
        isParsing.value = false
        return false
      }

      treeData.value = response.list.map(item => assignUiIds(item))
      isParsing.value = false
      return true
    } catch (e: any) {
      parseError.value = `解析失败: ${e.message || '未知错误'}`
      isParsing.value = false
      return false
    }
  }

  function toggleNode(uiId: string): void {
    const node = findNodeById(treeData.value, uiId)
    if (!node) return

    node.checked = !node.checked
    node.indeterminate = false

    if (node.uiChildren) {
      for (const child of node.uiChildren) {
        setChildrenChecked(child, node.checked)
      }
    }

    updateAncestors(treeData.value, node)
    refreshSelectedIds()
  }

  function selectAll(): void {
    for (const node of treeData.value) {
      setChildrenChecked(node, true)
    }
    refreshSelectedIds()
  }

  function deselectAll(): void {
    for (const node of treeData.value) {
      setChildrenChecked(node, false)
    }
    refreshSelectedIds()
  }

  function refreshSelectedIds(): void {
    const ids = new Set<number>()
    collectSelectedIds(treeData.value, ids)
    selectedIds.value = ids
  }

  function saveGenericConfig(): void {
    saveGenericToLocal(genericConfig.value)
  }

  function loadGenericConfig(): void {
    genericConfig.value = loadGenericFromLocal()
  }

  function isUrlValid(url: string): boolean {
    return /^https?:\/\/.+/.test(url.trim())
  }

  async function scanArticles(): Promise<boolean> {
    scrapingError.value = null
    isScanning.value = true
    scrapedArticles.value = []
    selectedArticleIds.value = new Set()

    const url = genericConfig.value.entryUrl.trim()
    if (!url) {
      scrapingError.value = '请输入入口 URL'
      isScanning.value = false
      return false
    }

    if (!isUrlValid(url)) {
      scrapingError.value = 'URL 格式无效，请输入以 http:// 或 https:// 开头的地址'
      isScanning.value = false
      return false
    }

    if (!genericConfig.value.linkSelector.trim()) {
      scrapingError.value = '请填写文章链接 CSS 选择器'
      isScanning.value = false
      return false
    }

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
      if (genericConfig.value.cookie.trim()) {
        headers['Cookie'] = genericConfig.value.cookie.trim()
      }

      const response = await fetch(url, { headers })
      if (!response.ok) {
        scrapingError.value = `请求失败: HTTP ${response.status}`
        isScanning.value = false
        return false
      }

      const html = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      const linkEls = doc.querySelectorAll(genericConfig.value.linkSelector.trim())
      const articles: ScrapedArticle[] = []
      const seenUrls = new Set<string>()

      linkEls.forEach((el) => {
        const href = (el as HTMLAnchorElement).href || el.getAttribute('href') || ''
        const text = el.textContent?.trim() || ''
        if (!href || !text) return

        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href
        if (seenUrls.has(fullUrl)) return
        seenUrls.add(fullUrl)

        articles.push({
          url: fullUrl,
          title: text,
          checked: false,
          id: `article-${fullUrl}`,
        })
      })

      if (articles.length === 0) {
        scrapingError.value = '未找到匹配的文章链接，请检查 CSS 选择器'
        isScanning.value = false
        return false
      }

      scrapedArticles.value = articles
      isScanning.value = false
      return true
    } catch (e: any) {
      scrapingError.value = `请求异常: ${e.message || '扫描失败'}`
      isScanning.value = false
      return false
    }
  }

  function toggleArticle(id: string): void {
    const article = scrapedArticles.value.find(a => a.id === id)
    if (!article) return

    article.checked = !article.checked
    const newSet = new Set(selectedArticleIds.value)
    if (article.checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    selectedArticleIds.value = newSet
  }

  function selectAllArticles(): void {
    for (const article of scrapedArticles.value) {
      article.checked = true
    }
    selectedArticleIds.value = new Set(scrapedArticles.value.map(a => a.id))
  }

  function deselectAllArticles(): void {
    for (const article of scrapedArticles.value) {
      article.checked = false
    }
    selectedArticleIds.value = new Set()
  }

  // ====== Yuque mode methods ======

  function saveYuqueConfig(): void {
    saveYuqueToLocal(yuqueConfig.value)
  }

  function loadYuqueConfig(): void {
    yuqueConfig.value = loadYuqueFromLocal()
  }

  function parseYuqueUrl(): boolean {
    yuqueParseError.value = null
    yuqueIsParsing.value = true
    yuqueTreeData.value = []

    const url = yuqueConfig.value.entryUrl.trim()
    if (!url) {
      yuqueParseError.value = '请输入语雀知识库 URL'
      yuqueIsParsing.value = false
      return false
    }

    const yuqueMatch = url.match(/^https?:\/\/www\.yuque\.com\/([^/]+)\/([^/]+)(?:\/([^/?#]+))?/)
    if (!yuqueMatch) {
      yuqueParseError.value = 'URL 格式不正确，请输入类似 https://www.yuque.com/username/repo/slug 的语雀知识库地址'
      yuqueIsParsing.value = false
      return false
    }

    yuqueIsParsing.value = false
    return true
  }

  function getYuqueUserSlug(): string {
    const match = yuqueConfig.value.entryUrl.match(/yuque\.com\/([^/]+)/)
    return match ? match[1] : ''
  }

  function getYuqueRepoSlug(): string {
    const match = yuqueConfig.value.entryUrl.match(/yuque\.com\/[^/]+\/([^/]+)/)
    return match ? match[1] : ''
  }

  function getYuqueDocSlug(): string {
    const match = yuqueConfig.value.entryUrl.match(/yuque\.com\/[^/]+\/[^/]+\/([^/?#]+)/)
    return match ? match[1] : 'welcome'
  }

  function toggleYuqueNode(uiId: string): void {
    function findAndToggle(nodes: YuqueTreeNode[]): boolean {
      for (const node of nodes) {
        if (node.uiId === uiId) {
          node.checked = !node.checked
          node.indeterminate = false
          setYuqueChildrenChecked(node, node.checked)
          return true
        }
        if (findAndToggle(node.children)) {
          updateYuqueParentIndeterminate(nodes)
          return true
        }
      }
      return false
    }
    findAndToggle(yuqueTreeData.value)
  }

  function setYuqueChildrenChecked(node: YuqueTreeNode, checked: boolean): void {
    for (const child of node.children) {
      child.checked = checked
      child.indeterminate = false
      setYuqueChildrenChecked(child, checked)
    }
  }

  function updateYuqueParentIndeterminate(nodes: YuqueTreeNode[]): void {
    for (const node of nodes) {
      if (node.children.length > 0) {
        const allChecked = node.children.every(c => c.checked)
        const anyChecked = node.children.some(c => c.checked || c.indeterminate)
        node.checked = allChecked
        node.indeterminate = anyChecked && !allChecked
      }
    }
  }

  function selectAllYuque(): void {
    function setAll(nodes: YuqueTreeNode[], checked: boolean) {
      for (const node of nodes) {
        node.checked = checked
        node.indeterminate = false
        setAll(node.children, checked)
      }
    }
    setAll(yuqueTreeData.value, true)
  }

  function deselectAllYuque(): void {
    function setAll(nodes: YuqueTreeNode[], checked: boolean) {
      for (const node of nodes) {
        node.checked = checked
        node.indeterminate = false
        setAll(node.children, checked)
      }
    }
    setAll(yuqueTreeData.value, false)
  }

  return {
    mode,
    authConfig,
    rawCatalogJson,
    treeData,
    selectedIds,
    parseError,
    isParsing,
    generatePdf,
    genericConfig,
    scrapedArticles,
    scrapingError,
    isScanning,
    selectedArticleIds,
    stats,
    isConfigValid,
    hasSelection,
    isCatalogReady,
    genericArticleCount,
    saveAuthConfig,
    loadAuthConfig,
    parseCatalog,
    toggleNode,
    selectAll,
    deselectAll,
    saveGenericConfig,
    loadGenericConfig,
    scanArticles,
    toggleArticle,
    selectAllArticles,
    deselectAllArticles,
    // Yuque
    yuqueConfig,
    yuqueTreeData,
    yuqueParseError,
    yuqueIsParsing,
    getYuqueSelectedCount,
    getYuqueTotalCount,
    saveYuqueConfig,
    loadYuqueConfig,
    parseYuqueUrl,
    getYuqueUserSlug,
    getYuqueRepoSlug,
    getYuqueDocSlug,
    toggleYuqueNode,
    selectAllYuque,
    deselectAllYuque,
  }
})
