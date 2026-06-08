# SaaSSY 学习资料批量下载工具 — 任务规划

## 阶段划分

```
Phase 0 (基础设施) → Phase 1 (SaaSSY 配置与目录树) → Phase 2 (脚本生成与下载) → Phase 3 (HTML 转 PDF)
```

| 阶段 | 用户视角的完成标志 | 对应技术方案 |
|------|------------------|-------------|
| **Phase 0** | 打开 DevToolBox 能看到"SaaSSY 下载器"和"HTML 转 PDF"两个入口 | §3~5 |
| **Phase 1** | 可以在页面上输入认证信息、粘贴目录 JSON、看到目录树 | §6, §9 |
| **Phase 2** | 可以在目录树中勾选内容、实时看到统计、下载 Python 脚本 | §6~7 |
| **Phase 3** | 可以导入 HTML 文件、实时预览、导出为 PDF | §8 |

---

## Phase 0: 基础设施

> 此阶段完成后：路由和导航菜单已注册、类型定义和 Store 骨架已就绪、空的主视图可访问。

### 依赖图

```
Task 0.1 (类型定义)
    ↓
Task 0.2 (Store)
    ↓
Task 0.3 (路由 + 导航菜单)
```

### Task 0.1: 新增 SaaSSY 相关类型定义

| 属性 | 值 |
|------|-----|
| **通俗解释** | 定义目录树节点、认证配置、统计信息的数据结构，让 TypeScript 知道这些数据长什么样 |
| **技术方案** | §3.1 |
| **对应 AC** | AC-001, AC-002, AC-004, AC-020 |
| **文件** | `src/types/index.ts`（追加） |

**变更内容：**
- 新增 `CatalogNode` 接口
- 新增 `CatalogResponse` 接口
- 新增 `TreeNode` 接口（扩展 UI 状态字段）
- 新增 `AuthConfig` 接口
- 新增 `CatalogStats` 接口

**验证标准：**
1. 编译通过，`vue-tsc --noEmit` 无类型错误
2. `CatalogNode.contentType` 只能取值 `0 | 1 | 2`
3. `TreeNode` 继承了 `CatalogNode` 的所有字段，并包含 `uiId`, `checked`, `indeterminate`, `expanded` 四个 UI 状态字段

---

### Task 0.2: 创建 SaasyyDownloader Pinia Store

| 属性 | 值 |
|------|-----|
| **通俗解释** | 创建数据管理中心，管理认证配置、目录树数据、勾选状态——所有组件通过它共享数据 |
| **技术方案** | §4.1 |
| **对应 AC** | AC-016, AC-017, AC-001, AC-010, AC-011 |
| **文件** | `src/stores/saasyy-downloader.ts`（新建） |

**变更内容：**
- 状态字段：`authConfig`, `rawCatalogJson`, `treeData`, `selectedIds`, `parseError`, `isParsing`
- 计算属性：`stats`(CatalogStats), `isConfigValid`, `hasSelection`, `isCatalogReady`
- 方法骨架：`parseCatalog()`, `toggleNode()`, `selectAll()`, `deselectAll()`, `saveAuthConfig()`, `loadAuthConfig()`, `generateScript()`
- localStorage 读写逻辑

**验证标准：**
1. `authConfig` 初始化时自动从 localStorage 读取，存 `saasyy-auth-config` key
2. `saveAuthConfig()` 调用后，localStorage 中有对应 JSON
3. `isConfigValid` 在 cookie 和 accessProfile 均非空时为 true
4. `hasSelection` 在 `selectedIds.size > 0` 时为 true
5. `isCatalogReady` 在 treeData 有数据且 parseError 为 null 时为 true

---

### Task 0.3: 注册路由和导航菜单

| 属性 | 值 |
|------|-----|
| **通俗解释** | 让 SaaSSY 下载器和 HTML 转 PDF 两个工具出现在 DevToolBox 的导航栏中，点击能进入对应的工具页面 |
| **技术方案** | §5 |
| **对应 AC** | — |
| **文件** | `src/router/index.ts`, `src/components/layout/AppHeader.vue`, `src/components/layout/AppSidebar.vue` |

**变更内容：**
- `router/index.ts`：新增 `/saasyy-downloader` 和 `/html-to-pdf` 两个路由，均懒加载
- `AppHeader.vue`：导航栏新增"SaaSSY"和"HTML转PDF"两个按钮
- `AppSidebar.vue`：侧边栏"更多工具"中新增"SaaSSY 学习下载器"和"HTML 转 PDF"

**验证标准：**
1. 打开 DevToolBox → 导航栏可见"SaaSSY"按钮，点击后 URL 变为 `/saasyy-downloader`
2. 侧边栏可见"SaaSSY 学习下载器"，点击后同样可进入
3. 同理验证"HTML 转 PDF"
4. 访问不存在的路由仍自动跳转到 `/json`

---

## Phase 1: SaaSSY 下载器配置与目录树

> 此阶段完成后：用户可以在页面上填写认证信息、粘贴目录 JSON、点击解析看到目录树结构。

### 依赖图

```
Task 0.2 (Store) ← 所有任务依赖
       ↓
Task 1.1 (主视图 + AuthConfigPanel)
       ↓
Task 1.2 (CatalogJsonInput + Monaco)
       ↓
Task 1.3 (CatalogTreeNode 递归组件)
       ↓
Task 1.4 (CatalogTreePanel + StatsBar + 级联勾选)
```

### Task 1.1: 实现主视图和认证配置面板

| 属性 | 值 |
|------|-----|
| **通俗解释** | 用户进入 SaaSSY 下载器页面，可以看到一个分栏布局，左侧可以填写 Cookie 和 accessProfile |
| **技术方案** | §6.1, §9.1 |
| **对应 AC** | AC-012, AC-016 |
| **文件** | `src/views/SaasyyDownloaderTool.vue`, `src/components/saasyy-downloader/AuthConfigPanel.vue` |

**变更内容：**
- `SaasyyDownloaderTool.vue`：三栏布局（左栏 40%, 右栏 60%, 底部固定栏）
- `AuthConfigPanel.vue`：
  - Cookie 输入框（textarea，3行高）
  - accessProfile 输入框（textarea，3行高）
  - 获取指引折叠面板（纯文本说明 + 展开/折叠）
  - 输入变化时自动调用 `store.saveAuthConfig()`

**验证标准：**
1. 页面加载后，如 localStorage 有保存的值，Cookie 和 accessProfile 自动填充
2. 修改 Cookie 输入框的值，刷新页面后值仍然保留
3. 点击"获取指引"可展开/折叠说明文字
4. 布局符合三栏设计，左右比例 40:60

---

### Task 1.2: 实现目录 JSON 输入和解析

| 属性 | 值 |
|------|-----|
| **通俗解释** | 用户在右侧 Monaco 编辑器中粘贴目录 JSON，点击"解析目录"按钮，如果 JSON 合法就生成目录树数据 |
| **技术方案** | §3.1, §4.1, §9.1 |
| **对应 AC** | AC-001, AC-010, AC-011 |
| **文件** | `src/components/saasyy-downloader/CatalogJsonInput.vue` |

**变更内容：**
- `CatalogJsonInput.vue`：
  - Monaco Editor 组件，`language="json"`
  - 内容变化时更新 `store.rawCatalogJson`
  - "解析目录"按钮 → 调用 `store.parseCatalog()`
  - 解析错误时显示红色错误提示条
  - 解析成功时 emit `parsed` 事件，主视图切换到目录树面板

**`parseCatalog()` 逻辑（Store 中实现）：**
1. 尝试 `JSON.parse(rawCatalogJson)`
2. 校验：`result.status === true` 且 `Array.isArray(result.list)`
3. 递归遍历 `list`，为每个节点生成 `uiId`（格式：`node-{id}`）
4. 初始化 `checked=false`, `indeterminate=false`, `expanded=true`
5. 将 CatalogNode 映射为 TreeNode，存入 `treeData`
6. 解析失败时设置 `parseError`

**验证标准：**
1. 粘贴无效 JSON（如 `{abc}`）→ 点击解析 → 显示"JSON 格式错误"
2. 粘贴缺少 `list` 字段的 JSON → 点击解析 → 显示"目录数据异常"
3. 粘贴合法目录 JSON → 点击解析 → 无错误提示，`treeData` 有数据
4. 所有节点 `uiId` 格式为 `node-{id}`，`expanded` 为 true

---

### Task 1.3: 实现目录树递归节点组件

| 属性 | 值 |
|------|-----|
| **通俗解释** | 将解析出来的目录树渲染为带缩进、图标、checkbox 的树形列表，看起来像文件管理器 |
| **技术方案** | §7.2 |
| **对应 AC** | AC-001, AC-002, AC-003, AC-004 |
| **文件** | `src/components/saasyy-downloader/CatalogTreeNode.vue` |

**变更内容：**
- `CatalogTreeNode.vue`（递归组件）：
  - `defineOptions({ name: 'CatalogTreeNode' })` 启用递归
  - Props: `node: TreeNode`
  - Emits: `toggle` (uiId)
  - 节点行：展开/折叠箭头（目录节点）、checkbox、类型图标、标题
  - 类型图标映射：contentType=0 → 📁, 1 → 📄, 2 → 🎬
  - checkbox 绑定 `checked` 和 `indeterminate`
  - 缩进通过 padding-left 实现，每层增加 20px
  - v-if 控制子节点展开/折叠

**验证标准：**
1. 目录节点（contentType=0）显示 📁 图标，有展开/折叠箭头
2. 图文节点（contentType=1）显示 📄 图标
3. 视频节点（contentType=2）显示 🎬 图标
4. 子节点相对于父节点缩进 20px
5. checkbox 状态正确反映 `node.checked` 和 `node.indeterminate`

---

### Task 1.4: 实现目录树容器和级联勾选逻辑

| 属性 | 值 |
|------|-----|
| **通俗解释** | 把目录树组件包起来，加上全选/取消全选工具栏和实时统计条，用户勾选时子节点和父节点自动联动 |
| **技术方案** | §4.1, §6.1, §9.1 |
| **对应 AC** | AC-002, AC-003, AC-004, AC-009 |
| **文件** | `src/components/saasyy-downloader/CatalogTreePanel.vue`, `src/components/saasyy-downloader/CatalogStatsBar.vue` |

**变更内容：**

`CatalogTreePanel.vue`：
- 顶部工具栏："☑ 全选" / "☐ 取消全选" 按钮
- CatalogStatsBar 组件
- CatalogTreeNode 递归渲染
- "🔄 重新解析" 按钮 → 切换回 JSON 输入模式

`CatalogStatsBar.vue`：
- 📁 N 目录 · 📄 N 图文 · 🎬 N 视频（总计）
- 📄 N 已选图文 · 🎬 N 已选视频（已选）

Store 中实现的 `toggleNode(uiId)` 级联逻辑：

```
function toggleNode(uiId):
    node = 在 treeData 中按 uiId 查找节点
    node.checked = !node.checked

    // 级联向下
    for each descendant of node:
        descendant.checked = node.checked

    // 级联向上
    updateAncestors(node)

function updateAncestors(node):
    while node has parent:
        allChecked = every child of parent is checked
        anyChecked = any child of parent is checked
        parent.checked = allChecked
        parent.indeterminate = anyChecked && !allChecked
        node = parent
```

**验证标准：**
1. 全选 → 所有节点勾选，顶部显示"已选 N/N 个文件"
2. 取消全选 → 所有节点取消勾选
3. 勾选一个目录节点 → 其所有子节点自动勾选
4. 取消一个目录节点 → 其所有子节点自动取消
5. 部分子节点勾选 → 父节点显示半选状态（[-]）
6. 最后一个子节点取消 → 父节点变为未选
7. 统计信息实时更新

---

## Phase 2: 脚本生成与下载

> 此阶段完成后：用户点击底部按钮即可生成并下载完整的 Python 下载脚本。

### Task 2.1: 实现 Python 脚本模板

| 属性 | 值 |
|------|-----|
| **通俗解释** | 写一个完整的 Python 脚本模板，包含下载图文、视频、图片的所有逻辑，用户填入配置就能直接运行 |
| **技术方案** | §7.1, §7.2 |
| **对应 AC** | AC-006, AC-007, AC-008, AC-009, AC-014, AC-015, AC-018, AC-019, AC-020 |
| **文件** | `src/components/saasyy-downloader/pythonScriptTemplate.ts`（新建） |

**变更内容：**
- 导出 `generateScriptContent(cookie, accessProfile, catalogJson, selectedIds)` 函数
- 模板变量替换生成完整 Python 脚本

**Python 脚本包含的功能：**
1. 配置区：COOKIE, ACCESSPROFILE, CATALOG_JSON, SELECTED_IDS, EXTRA_HEADERS, OUTPUT_DIR
2. `download_file(url, filepath)` — 通用下载，重试 3 次，流式写入
3. `download_article(article_id, html_filepath)` — 调用 API 获取 HTML
4. `download_images_and_replace(html_content, base_dir)` — 下载图片 + 替换 src
5. `download_video(video_url, filepath)` — 流式下载 MP4
6. `process_node(node, parent_path)` — 递归遍历
7. `main()` — 入口，遍历目录树按 selected_ids 过滤

**验证标准：**
1. 生成的脚本是合法 Python 语法（无语法错误）
2. 配置区可找到完整的 CATALOG_JSON 和 SELECTED_IDS
3. 模板中的 `{{COOKIE}}`、`{{ACCESSPROFILE}}` 等占位符全部被替换
4. 脚本包含 `download_images_and_replace` 函数的完整实现

---

### Task 2.2: 实现脚本生成按钮和下载

| 属性 | 值 |
|------|-----|
| **通俗解释** | 底部固定栏显示勾选统计和"生成并下载脚本"按钮，点击后浏览器自动下载一个 .py 文件 |
| **技术方案** | §7.1 |
| **对应 AC** | AC-005, AC-012, AC-013 |
| **文件** | `src/components/saasyy-downloader/ScriptGeneratorBar.vue`, `src/stores/saasyy-downloader.ts`（追加 generateScript 方法） |

**变更内容：**
- `ScriptGeneratorBar.vue`：
  - 底部固定栏，显示"已勾选 N/M 个文件"
  - "⬇ 生成并下载脚本" 按钮
  - 按钮在以下情况 disabled：
    - Cookie 或 accessProfile 为空 → 提示"请先填写认证信息"
    - 未勾选任何内容 → 提示"请至少勾选一个下载项"
- `store.generateScript()`：
  - 调用 `generateScriptContent()` 生成脚本文本
  - 创建 Blob → 生成 download URL → 触发下载 → 释放 URL
  - 文件名：`download_saasyy.py`

**验证标准：**
1. 未填 Cookie 时按钮不可点击，hover 显示"请先填写认证信息"
2. 未勾选内容时按钮不可点击，hover 显示"请至少勾选一个下载项"
3. 配置完整且勾选了内容 → 按钮可点击
4. 点击后浏览器下载 `download_saasyy.py` 文件
5. 下载的脚本文件内容包含用户填写的 Cookie 和 accessProfile

---

## Phase 3: HTML 转 PDF 工具

> 此阶段完成后：用户可以在 DevToolBox 中粘贴或导入 HTML 文件，实时预览，一键导出为 PDF。

### Task 3.1: 创建 HtmlToPdf Store

| 属性 | 值 |
|------|-----|
| **通俗解释** | 管理 HTML 内容、页面设置（纸张大小、边距）的数据，为 PDF 导出做准备 |
| **技术方案** | §4.2 |
| **对应 AC** | AC-021, AC-024 |
| **文件** | `src/stores/html-to-pdf.ts`（新建） |

**变更内容：**
- 状态：`htmlContent`, `htmlTitle`, `pageSize`（默认 A4）, `margin`（默认 10）
- 方法：`setHtmlContent(val)`, `loadHtmlFile(file)`

**验证标准：**
1. `setHtmlContent('<html><title>测试</title></html>')` → `htmlTitle` 为"测试"
2. `pageSize` 默认值为 `'A4'`
3. `margin` 默认值为 `10`

---

### Task 3.2: 实现 HTML 转 PDF 主视图

| 属性 | 值 |
|------|-----|
| **通俗解释** | 一个所见即所得的 HTML 转 PDF 工具——左边写 HTML，右边实时预览效果，调好纸张和边距，点击导出即可在打印对话框中选"另存为 PDF" |
| **技术方案** | §8 |
| **对应 AC** | AC-021, AC-022, AC-023, AC-024 |
| **文件** | `src/views/HtmlToPdfTool.vue`（新建） |

**变更内容：**
- 顶部状态栏："HTML 转 PDF — 粘贴或导入 HTML 文件"
- 主体：左右分栏
  - 左栏：Monaco Editor，`language="html"`，实时更新 Store
  - 右栏：`<iframe>` 渲染 HTML 预览，自动注入打印样式 CSS
- 底部设置栏：
  - 页面大小：`<select>` 选项 A4 / Letter / Legal
  - 边距：`<input type="number">` 单位 mm
  - "📂 导入文件" 按钮：`<input type="file" accept=".html,.htm">`
  - "🖨 导出 PDF" 按钮：调用 `iframe.contentWindow.print()`
- 注入预览的打印 CSS：
  ```css
  @media print {
    @page { size: {{pageSize}}; margin: {{margin}}mm; }
    body { font-family: 'Inter', system-ui, sans-serif; font-size: 12pt; line-height: 1.6; }
    img { max-width: 100%; }
  }
  ```

**验证标准：**
1. 左侧 Monaco 编辑器输入 `<h1>Hello</h1>` → 右侧 iframe 实时显示"Hello"
2. 点击"导入文件"选择 .html 文件 → 编辑器加载文件内容，预览更新
3. 调整页面大小为"Letter" → 预览页面宽度适应 Letter 纸张比例
4. 调整边距为 20mm → 预览内容区域缩小
5. 点击"导出 PDF" → 浏览器弹出打印对话框
6. 在打印对话框中选择"另存为 PDF" → 导出的 PDF 内容与预览一致

---

---

## Phase 4: 通用网页抓取模式（CR-001 新增）

> 此阶段完成后：用户可以在工具顶部切换"通用网页抓取"模式，填写入口 URL 和 CSS 选择器，扫描文章列表，勾选后下载 Python 抓取脚本。

### 依赖图

```
Task 0.1 (类型定义) ← 新增类型依赖
       ↓
Task 4.0 (Store 扩展: mode + 通用抓取状态)
       ↓
Task 4.1 (主视图改造 + 模式选择器)
       ↓
Task 4.2 (GenericScrapingConfig 组件)
       ↓
Task 4.3 (scanArticles 逻辑 + ArticleListPanel)
       ↓
Task 4.4 (通用抓取 Python 脚本模板)
       ↓
Task 4.5 (ScriptGeneratorBar 适配双模式 + 回归验证)
```

### Task 4.0: 扩展 Store 支持双模式和通用抓取状态

| 属性 | 值 |
|------|-----|
| **通俗解释** | 在现有的 Store 中增加新状态：当前模式（SaaSSY/通用）、通用抓取的配置参数、扫描到的文章列表。让两种模式的数据互不干扰 |
| **技术方案** | §4.1 CR-001 |
| **对应 AC** | AC-021, AC-022, AC-023, AC-028~031, AC-034, AC-035 |
| **文件** | `src/types/index.ts`（修改）, `src/stores/saasyy-downloader.ts`（修改） |

**变更内容：**

`src/types/index.ts` 新增：
- `GenericScrapingConfig` 接口
- `ScrapedArticle` 接口
- `ScrapingResult` 接口

`src/stores/saasyy-downloader.ts` 新增：
- `mode: 'saasyy' | 'generic'` 状态
- `genericConfig: GenericScrapingConfig` 状态（含 entryUrl, linkSelector, titleSelector, contentSelector, paginationSelector, cookie, extraHeaders）
- `scrapedArticles: ScrapedArticle[]` 状态
- `scrapingError: string | null` 状态
- `isScanning: boolean` 状态
- `selectedArticleIds: Set<string>` 状态
- `scanArticles()` 方法（发送 HTTP 请求 → 解析 HTML → 提取链接）
- `toggleArticle(id)` / `selectAllArticles()` / `deselectAllArticles()` 方法
- `saveGenericConfig()` / `loadGenericConfig()` 方法（localStorage key: `scraping-generic-config`）
- 更新 `isConfigValid`、`hasSelection` 计算属性适配双模式

**验证标准：**
1. `mode` 初始值为 `'saasyy'`
2. 切换 `mode` 后，原有 SaaSSY 的 treeData/selectedIds 不受影响
3. `scanArticles()` 使用 `fetch()` 发送 GET 请求，通过 `text/html` 解析
4. 扫描成功后 `scrapedArticles` 包含正确的文章标题和完整 URL（相对路径自动拼接）
5. 扫描失败（网络错误/非 200）时 `scrapingError` 有值
6. `saveGenericConfig()` 调用后 localStorage 中有 `scraping-generic-config` key
7. 所有类型编译通过，`vue-tsc --noEmit` 无类型错误

> **注意**: `scanArticles()` 在浏览器端直接请求目标网站可能会遇到 CORS 限制。如果目标网站不允许跨域请求，扫描功能在浏览器端会失败。这种情况下用户需要自行确认目标网站允许跨域访问，或者浏览器端有 CORS 插件。

---

### Task 4.1: 改造主视图，添加模式选择器

| 属性 | 值 |
|------|-----|
| **通俗解释** | 在现有下载器页面顶部添加一个模式切换标签（SaaSSY 预设 / 通用网页抓取），切换时左栏和右栏显示不同的配置面板和内容 |
| **技术方案** | §6.1, §9.1, §9.2 CR-001 |
| **对应 AC** | AC-021 |
| **文件** | `src/views/SaasyyDownloaderTool.vue`（修改） |

**变更内容：**
- 在顶部标题栏下方添加模式切换 tabs（两个按钮："SaaSSY 预设" / "通用网页抓取"）
- 选中的 tab 高亮显示，切换时更新 `store.mode`
- 左栏：`mode === 'saasyy'` 时渲染 `AuthConfigPanel`，否则渲染 `GenericScrapingConfig`
- 右栏：`mode === 'saasyy'` 时显示 SaaSSY 的树面板或空状态，否则显示通用模式的文章列表或空状态
- 右栏空状态提示根据模式不同：SaaSSY 模式提示"请在左侧填写三份信息"，通用模式提示"请在左侧配置抓取参数"
- 顶部标题行更新为"⬇ 批量下载器"，加上模式指示
- 更新侧边栏 `AppSidebar.vue` 分组名称为"批量下载"

**验证标准：**
1. 页面顶部有两个 tabs："SaaSSY 预设" 和 "通用网页抓取"
2. 默认选中"SaaSSY 预设"，界面与原有行为完全一致
3. 点击"通用网页抓取"，左栏切换到通用配置面板，右栏显示通用模式的空状态提示
4. 切换回 SaaSSY 模式，之前配置的 SaaSSY 信息完整保留
5. 侧边栏分组名称改为"批量下载"

---

### Task 4.2: 实现通用网页抓取配置面板

| 属性 | 值 |
|------|-----|
| **通俗解释** | 一个配置表单，让用户填写目标网站的入口 URL 和 CSS 选择器，告诉工具"去哪抓"和"怎么抓" |
| **技术方案** | §9.2 CR-001 |
| **对应 AC** | AC-021, AC-028, AC-031, AC-034, AC-035 |
| **文件** | `src/components/saasyy-downloader/GenericScrapingConfig.vue`（新建） |

**变更内容：**
- 入口 URL 输入框（`<input type="url">`，placeholder: `https://www.chanjetvip.com/doc/cate-68/second-106.html`）
- 文章链接选择器输入框（placeholder: `a[href*="/doc/cate-68/doc-"]`）
- 文章标题选择器输入框（placeholder: `h1`）
- 正文内容选择器输入框（placeholder: `.article-content`）
- 翻页选择器输入框（可选，placeholder: `.pagination .next a`）
- Cookie 输入框（可选，textarea，2行高）
- 所有输入变化时自动调用 `store.saveGenericConfig()`
- "🔍 扫描文章"按钮：
  - 未填入口 URL 或必要选择器时 disabled
  - 点击时调用 `store.scanArticles()`
  - 扫描中显示 loading 状态
- 错误提示区域（URL 格式无效、请求失败、未找到文章等）
- 扫描结果统计（扫描到 N 篇文章）
- localStorage 自动保存和加载

**验证标准：**
1. 6 个配置项完整渲染（4 个必填 + 2 个可选）
2. 入口 URL 输入框中填写非法 URL（如 `abcd`）→ 点击扫描 → 显示"URL 格式无效"
3. 不填选择器直接点击扫描 → 按钮 disabled
4. 填写合法 URL 和选择器 → 点击扫描 → 按钮变为 loading 状态
5. 扫描完成后显示"扫描到 N 篇文章"
6. 刷新页面后，之前填写的配置自动恢复

---

### Task 4.3: 实现扫描文章列表面板

| 属性 | 值 |
|------|-----|
| **通俗解释** | 扫描结果展示区，用户可以看到找到的所有文章列表，勾选需要下载的文章，看到实时统计 |
| **技术方案** | §6.4, §9.2 CR-001 |
| **对应 AC** | AC-022, AC-023, AC-030 |
| **文件** | `src/components/saasyy-downloader/ArticleListPanel.vue`（新建） |

**变更内容：**
- 顶部工具栏："☑ 全选" / "☐ 取消全选" 按钮
- 文章列表（虚拟滚动或普通列表）：
  - 每行显示 checkbox + 文章标题 + URL（截断显示）
  - 点击 checkbox 切换勾选
  - 点击文章标题在新标签页打开（可选）
- 底部统计条："共扫描 N 篇，已选 M 篇"
- 空状态：扫描前显示"请先在左侧配置参数并扫描"，扫描无结果显示"未找到匹配文章"
- 当 `scrapingError` 有值时显示错误提示

**验证标准：**
1. 扫描完成后，右侧面板展示文章列表
2. 每篇文章显示 checkbox、标题 和 URL
3. 全选 → 所有文章勾选，底部显示"已选 N 篇"
4. 取消全选 → 全部取消
5. 勾选/取消单篇文章 → 底部统计实时更新
6. 无匹配文章时显示友好提示

---

### Task 4.4: 实现通用抓取 Python 脚本模板

| 属性 | 值 |
|------|-----|
| **通俗解释** | 写一个完整的 Python 脚本模板，使用 requests + BeautifulSoup 抓取网页内容、下载图片，用户下载后可以直接运行 |
| **技术方案** | §7.3 CR-001 |
| **对应 AC** | AC-025, AC-026, AC-027, AC-033, AC-036, AC-037, AC-038 |
| **文件** | `src/components/saasyy-downloader/genericScriptTemplate.ts`（新建） |

**变更内容：**
- 导出 `generateGenericScriptContent(config: GenericScrapingConfig, selectedArticles: ScrapedArticle[])` 函数
- 模板变量替换生成完整 Python 脚本

**Python 脚本包含的功能：**
1. 配置区：ENTRY_URL, LINK_SELECTOR, TITLE_SELECTOR, CONTENT_SELECTOR, PAGINATION_SELECTOR, COOKIE, EXTRA_HEADERS, SELECTED_URLS
2. `download_file(url, filepath)` — 通用文件下载，重试 3 次
3. `resolve_url(base_url, href)` — 解析相对路径/绝对路径，处理 `<base>` 标签
4. `download_images_and_replace(html_content, base_dir, page_url)` — 使用 BeautifulSoup 下载图片 + 替换 src
5. `scrape_article(url, output_dir)` — 抓取单篇文章，提取标题 + 正文，保存 HTML
6. `scrape_listing(url, link_selector, pagination_selector)` — 扫描列表页（含翻页）
7. `main()` — 遍历 SELECTED_URLS 逐篇下载

**验证标准：**
1. 生成的脚本是合法 Python 语法
2. 配置区可找到完整的 SELECTED_URLS（包含用户勾选的每篇文章 URL）
3. 模板中所有 `{{ENTRY_URL}}`、`{{LINK_SELECTOR}}` 等占位符全部被替换
4. 脚本包含 `download_images_and_replace` 使用 BeautifulSoup 的完整实现
5. 脚本包含 `<base>` 标签处理逻辑
6. 脚本开头有注释说明需安装 `requests` 和 `beautifulsoup4`

---

### Task 4.5: 适配 ScriptGeneratorBar + 回归验证

| 属性 | 值 |
|------|-----|
| **通俗解释** | 让底部的脚本生成栏能适配两种模式，在通用模式下显示文章统计和不同的下载文件名，并验证 SaaSSY 模式没被改坏 |
| **技术方案** | §6.1, §7.3 CR-001 |
| **对应 AC** | AC-024, AC-032 |
| **文件** | `src/components/saasyy-downloader/ScriptGeneratorBar.vue`（修改） |

**变更内容：**
- `ScriptGeneratorBar.vue` 适配双模式：
  - SaaSSY 模式：显示"已勾选 N/M 个文件"，下载 `download_saasyy.py`
  - 通用模式：显示"已勾选 N/M 篇文章"，下载 `scrape_generic.py`
  - `generateAndDownload()` 根据 `store.mode` 调用不同的模板生成函数
  - 通用模式下按钮 disabled 条件：未填入口 URL 或未勾选文章
- 回归验证：在 SaaSSY 模式下，原有功能（全选/取消/勾选/统计/生成脚本）全部正常

**验证标准：**
1. SaaSSY 模式下，底部栏显示"已勾选 X/Y 个文件"，点击生成下载 `download_saasyy.py`
2. 切换到通用模式并扫描文章后，底部栏显示"已勾选 X/Y 篇文章"
3. 通用模式下未勾选文章时按钮 disabled，提示"请至少勾选一篇文章"
4. 通用模式点击生成 → 下载 `scrape_generic.py`，脚本中包含已选文章 URL 列表
5. **回归验证**: 切回 SaaSSY 模式，AC-005 / AC-012 / AC-013 全部通过

---

## 总结

| 阶段 | 任务数 | 主要交付物 |
|------|--------|-----------|
| Phase 0: 基础设施 | 3 | 类型 + Store + 路由/导航 |
| Phase 1: 配置与目录树 | 4 | 6 个组件 + 级联逻辑 |
| Phase 2: 脚本生成下载 | 2 | 脚本模板 + 生成按钮 |
| Phase 3: HTML 转 PDF | 2 | Store + 完整工具页面 |
| Phase 4: 通用网页抓取 (CR-001) | 6 | Store 扩展 + 2 个新组件 + 脚本模板 + 主视图改造 |
| **合计** | **17** | **约 18 个文件（含 CR-001 新增/修改）** |
