# 批量下载工具 — 变更任务 CR-001

## 变更信息

| 字段 | 值 |
|------|-----|
| **CR 编号** | CR-001 |
| **标题** | 新增通用网页抓取模式 |
| **变更类型** | 扩展 |
| **变更日期** | 2026-05-09 |
| **变更原因** | 现有 SaaSSY 下载器只能固定下载 `demo.saasyy.com` 一个站点的内容，用户需要下载其他网站（如 `www.chanjetvip.com`）的文档内容 |
| **影响范围** | 需求文档、技术方案、任务规划均已更新 |

## 变更摘要

将现有的 SaaSSY 单一下载器改造为**双模式一体化工具**：

- **SaaSSY 预设模式**：原有功能完全不变
- **通用网页抓取模式**（新增）：用户填写入口 URL + CSS 选择器，扫描文章列表，生成基于 `requests` + `BeautifulSoup` 的 Python 抓取脚本

## 影响文件清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/types/index.ts` | 修改 | 新增 `GenericScrapingConfig`, `ScrapedArticle`, `ScrapingResult` 类型 |
| `src/stores/saasyy-downloader.ts` | 修改 | 新增双模式状态和方法 |
| `src/views/SaasyyDownloaderTool.vue` | 修改 | 添加模式选择器，条件渲染 |
| `src/components/saasyy-downloader/ScriptGeneratorBar.vue` | 修改 | 适配双模式 |
| `src/components/saasyy-downloader/GenericScrapingConfig.vue` | 新增 | 通用抓取配置面板 |
| `src/components/saasyy-downloader/ArticleListPanel.vue` | 新增 | 文章列表面板 |
| `src/components/saasyy-downloader/genericScriptTemplate.ts` | 新增 | 通用 Python 脚本模板 |
| `src/components/layout/AppSidebar.vue` | 修改 | 分组名称更新 |

## 受影响文档

| 文档 | 变更内容 |
|------|---------|
| `saasyy-downloader_需求文档.md` | 标题更新、新增通用模式流程和 AC-021~AC-038 |
| `saasyy-downloader_技术方案.md` | 新增 §3.2 通用类型、§4.1 Store 扩展、§6.1~6.4 组件树和数据流、§7.3 脚本模板、§9.2 UI 布局、§10 AC 覆盖矩阵 |
| `saasyy-downloader_任务规划.md` | 新增 Phase 4（6 个任务 T-4.0 ~ T-4.5） |

## 新增验收标准

### Happy Path
- **AC-021** ~ **AC-027**: 通用模式配置、扫描、勾选、脚本生成、本地执行、图片离线化、翻页

### Edge & Error Cases
- **AC-028** ~ **AC-034**: URL 校验、请求失败、无匹配文章、选择器为空、未勾选、下载重试、配置持久化

### Business Rules
- **AC-035** ~ **AC-038**: localStorage 保存、依赖说明、base 标签处理、CSS 选择器语法

## 新增任务列表（Phase 4）

| 编号 | 任务名称 | 依赖 | 对应 AC |
|------|---------|------|---------|
| T-4.0 | 扩展 Store 支持双模式和通用抓取状态 | Task 0.1 | AC-021, AC-022, AC-023, AC-028~031, AC-034, AC-035 |
| T-4.1 | 改造主视图，添加模式选择器 | T-4.0 | AC-021 |
| T-4.2 | 实现通用网页抓取配置面板 | T-4.0 | AC-021, AC-028, AC-031, AC-034, AC-035 |
| T-4.3 | 实现扫描文章列表面板 | T-4.2 | AC-022, AC-023, AC-030 |
| T-4.4 | 实现通用抓取 Python 脚本模板 | T-4.0 | AC-025~027, AC-033, AC-036~038 |
| T-4.5 | 适配 ScriptGeneratorBar + 回归验证 | T-4.1, T-4.3, T-4.4 | AC-024, AC-032 |

## 回归验证要求

完成所有 Phase 4 任务后，必须验证以下 SaaSSY 模式原有 AC 仍能通过：

- **AC-005**: SaaSSY 模式下点击生成 → 下载 `download_saasyy.py`
- **AC-012**: 未填 Cookie/AccessProfile → 按钮 disabled
- **AC-013**: 未勾选内容 → 按钮 disabled

同时验证模式切换的数据隔离：
- SaaSSY 模式的 `treeData` / `selectedIds` 在切换到通用模式后保持不变
- 通用模式的 `scrapedArticles` / `selectedArticleIds` 在切换回 SaaSSY 模式后保持不变
