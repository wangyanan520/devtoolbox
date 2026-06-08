# DevToolBox — Agent 开发规则手册

> **适用范围**: `tool-site/` 目录下的所有文件（包括 `src/`、配置文件等）
> **优先级**: 本文件中的规则对 `tool-site/` 范围内所有文件的修改具有最高约束力，除非用户指令明确覆盖

---

## 1. 项目概述

DevToolBox 是一个面向开发者的多功能 Web 工具集，基于 **Vue 3 + TypeScript + Vite** 构建。

### 核心功能

| 工具 | 路由 | 状态管理 | 说明 |
|------|------|----------|------|
| JSON 编辑器 | `/json` | `json-editor.ts` | 5 种视图（代码/树/表单/预览/表格） |
| YAML/JSON 互转 | `/yaml-json` | `yaml-converter.ts` | 双端实时转换 |
| SaaSSY 下载器 | `/saasyy-downloader` | `saasyy-downloader.ts` | 批量下载 + 通用抓取 + 语雀文档 |
| HTML 转 PDF | `/html-to-pdf` | `html-to-pdf.ts` | HTML 预览 + 导出 |
| 工作台首页 | `/` | — | 工具聚合入口 |

---

## 2. 架构与目录结构

```
tool-site/
├── index.html
├── vite.config.ts          # Vite 配置（@ 别名、端口 3000）
├── tsconfig.json           # strict: true, paths: @/ -> src/*
├── tailwind.config.js      # 自定义 primary 色板 + darkMode: class
├── postcss.config.js
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.ts             # 入口：Pinia + Router + App
    ├── App.vue             # 根组件（Header + Sidebar + RouterView + Toast）
    ├── env.d.ts            # 模块声明
    ├── assets/
    │   └── main.css        # Tailwind 指令 + 全局样式 + 暗色变量 + 滚动条
    ├── router/
    │   └── index.ts        # 路由配置（懒加载）
    ├── stores/             # Pinia 组合式 stores
    │   ├── app.ts          # 全局（主题、侧边栏、面板宽度）
    │   ├── json-editor.ts  # JSON 编辑器状态
    │   ├── html-to-pdf.ts  # HTML 转 PDF 状态
    │   ├── yaml-converter.ts   # YAML/JSON 转换状态
    │   └── saasyy-downloader.ts # 下载器状态（SaaSSY/通用/语雀三模式）
    ├── types/
    │   └── index.ts        # 所有接口定义（ToolItem, JsonPathNode, CatalogNode, TreeNode 等）
    ├── utils/
    │   └── json.ts         # JSON 工具函数（树解析、路径取值、格式化、类型颜色）
    ├── composables/
    │   └── useToast.ts     # Toast 通知（success/error/info/warning）
    ├── views/              # 页面组件（路由懒加载目标）
    │   ├── HomePage.vue
    │   ├── JsonTool.vue
    │   ├── YamlConverterTool.vue
    │   ├── HtmlToPdfTool.vue
    │   ├── SaasyyDownloaderTool.vue
    │   └── SaasyyPdfConverterTool.vue
    └── components/         # 可复用组件
        ├── json/           # JSON 编辑器子组件
        │   ├── MonacoEditor.vue    # Monaco 编辑器封装（通用，可设 language）
        │   ├── JsonToolbar.vue     # 工具栏（格式化/压缩/验证/搜索/复制/下载/导入）
        │   ├── SearchReplace.vue   # 搜索替换浮层
        │   ├── JsonOutline.vue     # 结构大纲面板
        │   ├── JsonPropertyPanel.vue # 属性面板
        │   ├── JsonTreeView.vue    # 树状视图
        │   ├── JsonFormView.vue    # 表单视图（可编辑）
        │   ├── JsonPreviewView.vue # 高亮渲染预览
        │   └── JsonTableView.vue   # 表格视图（仅数组）
        ├── layout/         # 布局组件
        │   ├── AppHeader.vue
        │   ├── AppSidebar.vue
        │   └── ToastContainer.vue
        ├── yaml-converter/
        │   └── YamlConverterView.vue  # YAML/JSON 互转双编辑器页面
        └── saasyy-downloader/    # 下载器子组件
            ├── AuthConfigPanel.vue
            ├── CatalogTreePanel.vue
            ├── CatalogTreeNode.vue
            ├── CatalogStatsBar.vue
            ├── ScriptGeneratorBar.vue
            ├── GenericScrapingConfig.vue
            ├── ArticleListPanel.vue
            ├── YuqueConfigPanel.vue
            ├── pythonScriptTemplate.ts      # SaaSSY 下载脚本模板
            ├── yuqueScriptTemplate.ts        # 语雀下载脚本模板
            ├── genericScriptTemplate.ts      # 通用抓取脚本模板
            └── pdfConverterScriptTemplate.ts # PDF 合并脚本模板
```

---

## 3. 技术规范与约定

### 3.1 核心约束

| 项目 | 规范 |
|------|------|
| 语言 | **TypeScript 严格模式**（`tsconfig.json` 已配置 `strict: true`） |
| 框架 | Vue 3 — Composition API + `<script setup>` 语法糖 |
| 状态管理 | **Pinia** 组合式 Store（`defineStore('name', () => { ... })`） |
| 路由 | Vue Router 4 — `createWebHistory()` + **懒加载** `() => import(...)` |
| 样式 | **Tailwind CSS** — 禁止手动写 CSS（除动画 keyframes 和 Monaco 覆盖外） |
| 暗色模式 | `darkMode: 'class'` — 使用 `dark:` 前缀 |
| 图标 | 内联 SVG — 不使用字体图标库 |
| 字体 | Inter（UI） + JetBrains Mono（代码） — 仅通过 `index.html` 的 `<link>` 加载 |

### 3.2 新增功能的步骤

> **所有新增功能必须遵循以下流程**：

1. **先检查已有类型** — 在 `types/index.ts` 中定义或扩展所有接口
2. **创建 Store** — 在 `stores/` 下新建 Pinia Store，遵循命名规范
3. **创建工具函数** — 在 `utils/` 下添加纯函数，保持无副作用
4. **创建主视图** — 在 `views/` 下创建页面组件，懒加载注册到路由
5. **拆分子组件** — 视图复杂时拆入 `components/` 下对应子目录
6. **注册路由** — 在 `router/index.ts` 中添加路由记录，设置 `meta.title` 和 `meta.icon`
7. **更新侧边栏** — 在 `AppSidebar.vue` 中添加到对应分组
8. **更新首页** — 如果有新工具卡片，更新 `HomePage.vue`

### 3.3 Store 规范

- 使用 **组合式 API 风格**（`defineStore('name', () => { ... })`）
- 所有状态用 `ref()` / `computed()` 定义
- 所有方法声明为普通函数，最后统一 `return { ... }`
- 异步操作使用 `async/await`，配合 `try/catch` 统一错误处理
- 避免 Store 之间循环依赖

**示例**:
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useXxxStore = defineStore('xxx', () => {
  // 1. 状态
  const data = ref('')

  // 2. 计算属性
  const isEmpty = computed(() => !data.value)

  // 3. 方法
  function update(val: string) {
    data.value = val
  }

  // 4. 导出
  return { data, isEmpty, update }
})
```

### 3.4 组件规范

- **必须**使用 `<script setup lang="ts">`
- Props 用 `defineProps<{ ... }>()` 或 `withDefaults(defineProps<{...}>(), { ... })`
- Emits 用 `defineEmits<{ (e: 'eventName', payload: Type): void }>()`
- 暴露方法用 `defineExpose({ ... })`
- 避免在模板中写复杂表达式，提取为计算属性
- 组件名使用 **PascalCase**（`JsonToolbar.vue`、`MonacoEditor.vue`）

### 3.5 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `JsonFormView.vue` |
| Store 文件 | kebab-case | `json-editor.ts` |
| 工具函数文件 | kebab-case | `json.ts` |
| 类型文件 | kebab-case | `index.ts` |
| 视图文件 | PascalCase | `HomePage.vue` |
| 变量/函数 | camelCase | `handleSearch()`、`parsedData` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Pinia Store | camelCase + `use` 前缀 | `useJsonEditorStore` |
| 路由名 | kebab-case | `yaml-json` |
| CSS 类名 | Tailwind utility 类直接使用 | 不写自定义类名 |

### 3.6 样式规范

- **优先使用 Tailwind 工具类**，不在 `<style>` 中写自定义 CSS
- 只有以下场景允许写 `<style scoped>`：
  - Monaco 编辑器的 `.monaco-editor` 覆盖
  - 动画关键帧（`@keyframes`）
  - Vue TransitionGroup 的动画类
- 颜色使用 Tailwind 色板：`primary-*`（预定义）、`gray-*`、`red-*`、`green-*` 等
- 暗色模式统一使用 `dark:` 前缀
- 避免全局 `* { transition: ... }`，改为在具体组件上加过渡

### 3.7 Monaco 编辑器使用规范

MonacoEditor 是通用编辑器组件，按以下方式使用：

```vue
<MonacoEditor
  :model-value="store.content"
  @update:model-value="store.onChange"
  :language="'json'"         <!-- 可选，默认 json -->
  :readonly="false"           <!-- 可选，默认 false -->
  @editor-ready="onReady"     <!-- 可选，获取编辑器实例 -->
  @cursor-change="onCursor"   <!-- 可选，监听光标位置 -->
/>
```

注意：
- 在表单页面（如 YAML 转换器）初始化两个 Monaco 编辑器时，注意内存消耗
- 主题随全局暗色模式自动切换，无需额外处理
- 编辑器值变化通过 `update:modelValue` 事件传递，不要在组件内部直接修改 props

---

## 4. 路由规范

- 所有路由使用 **`createWebHistory()`**（非 hash 模式）
- 组件使用 **动态 `import()`** 懒加载
- 每个路由必须有 `meta` 对象，包含 `title` 和 `icon`
- 404 路由配置为 `/:pathMatch(.*)*` 重定向到 `/`
- 淘汰的路由配置重定向，不要保留无用路由

```typescript
{
  path: '/xxx',
  name: 'xxx',
  component: () => import('@/views/XxxTool.vue'),
  meta: { title: '工具名', icon: '🔧' },
}
```

---

## 5. Toast 通知使用规范

使用 `useToast()` composable（全局单例）：

```typescript
const toast = useToast()
toast.success('标题', '详情文本（可选）')
toast.error('标题', '详情')
toast.info('标题', '详情')
toast.warning('标题', '详情')
```

- 成功/普通操作后给出 toast 反馈
- 不要对编辑器即时输入变化弹 toast
- 异步操作失败必须弹 error toast
- 避免在短时间内连续弹同内容的 toast

---

## 6. 类型系统规范

- **所有数据接口必须在 `types/index.ts` 中定义**，禁止在组件内散布类型定义
- 使用 `interface` 而非 `type`（Vue 3 官方推荐）
- 枚举值使用 `联合类型` 而非 `enum` 关键字（更贴合 JSON 序列化）

```typescript
// ✅ 正确
export interface CatalogNode {
  id: number
  title: string
  contentType: 0 | 1 | 2  // 联合类型
  videoPath?: string
  children?: CatalogNode[]
}

// ❌ 禁止
// 在组件中写 `type Foo = ...`
// 只用 `any` 不用类型守卫
```

---

## 7. 错误处理规范

### 7.1 JSON/数据解析

```typescript
try {
  parsedData.value = JSON.parse(trimmed)
  isValid.value = true
} catch (e: any) {
  isValid.value = false
  errorMessage.value = e.message
  parsedData.value = null
}
```

- 所有 `JSON.parse` 必须包 try/catch
- 所有 `js-yaml` 的 `load()` / `dump()` 必须包 try/catch
- 文件读取使用 Promise 封装 + try/catch

### 7.2 异步操作

```typescript
async function loadData() {
  try {
    const res = await fetch(url)
    const text = await res.text()
    store.setContent(text)
    toast.success('导入成功')
  } catch {
    toast.error('导入失败', '无法获取内容')
  }
}
```

---

## 8. 可拖拽分割面板规范

实现可拖拽分割面板时，严格遵循以下模式：

```typescript
function startResize(e: MouseEvent) {
  const startX = e.clientX
  const startWidth = /* 初始宽度 */

  function onMouseMove(e: MouseEvent) {
    const dx = startX - e.clientX
    /* 更新宽度 */
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
```

> **注意**: 必须确保在组件卸载时（`onBeforeUnmount`）没有正在拖拽的残留监听。建议使用 `isDragging` 标志位来追踪。

---

## 9. 暗色模式规范

- 通过 `useAppStore().toggleTheme()` 切换
- 主题持久化到 `localStorage.getItem('theme')`
- Tailwind 使用 `dark:` 前缀
- 所有颜色组合必须在亮/暗模式下都有明确定义，不依赖浏览器默认值
- Monaco 编辑器主题通过 `appStore.isDark` 自动联动
- 菜单/面板背景使用 `backdrop-blur` + 半透明色实现毛玻璃效果

---

## 10. 代码红线（禁止行为）

| 红线 | 说明 |
|------|------|
| ❌ 使用 `any` 代替具体类型 | 优先使用 `unknown` + 类型守卫，其次 `interface` |
| ❌ 手动拼接 DOM 字符串 | 使用 Vue 模板语法（除 ToastContainer 的动态菜单外） |
| ❌ 全局 `* { transition }` | 会导致性能问题，仅在具体组件上使用 |
| ❌ 重复加载字体 | Google Fonts 只通过 `index.html` 加载一次 |
| ❌ 硬编码示例数据 | 提取为常量或从外部文件导入 |
| ❌ 使用 `window.print()` 模拟 PDF 导出 | 必须使用 `html2canvas` + `jsPDF` 或后端方案 |
| ❌ 双向绑定外的组件内修改 prop | 使用 `update:modelValue` emit |
| ❌ Store 之间循环依赖 | 如发现需重构抽取公共逻辑 |
| ❌ `v-html` 渲染用户输入 | 存在 XSS 风险，必须使用 `escapeHtml()` 或其他净化手段 |
| ❌ 在组件中直接读写 `localStorage`（除 useAppStore） | 统一在 Store 中封装 |

---

## 11. 文件操作规范

- 导入文件的 `<input type="file">` 使用临时创建 + click 模式
- 下载文件使用 `Blob` + `URL.createObjectURL` + 临时 `<a>` 标签
- 复制到剪贴板使用 `navigator.clipboard.writeText()`，兜底方案需提示用户手动复制
- 文件大小校验在读取前完成

```typescript
function importFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error('文件过大')
      return
    }
    const text = await file.text()
    store.setContent(text)
  }
  input.click()
}
```

---

## 12. 打包与构建规范

- 不支持 IE，`target: 'ES2020'`
- 构建使用 `vite build`，产物输出到 `dist/`
- 开发服务器运行在端口 3000，`host: true` 支持局域网访问
- 图片资源放在 `public/` 或 `src/assets/` 下，通过相对路径引用

---

## 13. Git 与协作规范

- **分支命名**: `feature/xxx`、`fix/xxx`、`refactor/xxx`
- **提交信息格式**: `<type>(<scope>): <description>`（如 `feat(json): add table view sorting`）
- 保持提交原子化，一个提交解决一个问题
- 不提交 `node_modules/`、`dist/`、`.env`、`*.log`

---

## 14. 常见陷阱（历史教训）

1. **SearchReplace 的 CSS 必须完整闭合** — 缺少 `}` 会导致后续组件样式失效
2. **拖拽监听必须在 `onMouseUp` 中清理** — 否则切换到其他页面后仍然存在幽灵监听
3. **YAML 转换的 `containsNull` 守卫容易产生 bug** — 不要直接 return 跳过更新
4. **`calculateStats` 递归前重置计数器** — `nodeCount.value = 0` 必须在递归前执行
5. **Sidebar 中配置 disabled 工具时** — 路由不存在也要保证用户点击不会炸
