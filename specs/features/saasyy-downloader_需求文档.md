# 批量下载工具 — 需求文档

## 功能概述
在 DevToolBox 工具站中提供一个**双模式批量下载器**，支持以下两种下载模式：

1. **SaaSSY 预设模式**（原有）：用户通过配置 Cookie、accessprofile 和目录 JSON，可视化预览和勾选需要下载的内容，生成可运行的 Python 下载脚本，专门用于 `demo.saasyy.com` 学习栏目。
2. **通用网页抓取模式**（新增）：用户通过配置入口 URL 和 CSS 选择器，自动扫描页面中的文章链接，勾选需要下载的内容，生成可运行 Python 抓取脚本，适用于任意静态 HTML 网站（如 `www.chanjetvip.com`）。

## 核心流程

### SaaSSY 预设模式（不变）
1. 用户在 SaaSSY 网站登录后，从浏览器开发者工具中复制 Cookie、accessprofile 和目录 JSON
2. 在工具页面粘贴以上信息 → 可视化目录树展示
3. 在目录树中勾选需要下载的内容（支持全选/反选/级联）
4. 点击"生成并下载脚本" → 下载完整的 Python 脚本
5. 用户在本地执行脚本 → 自动下载所有选中的图文、视频、图片到本地
6. 图片被下载到本地，HTML 中的图片引用自动替换为本地路径

### 通用网页抓取模式（新增）
1. 用户切换到"通用网页抓取"模式
2. 填写入口 URL（如 `https://www.chanjetvip.com/doc/cate-68/second-106.html`）
3. 配置 CSS 选择器：文章链接选择器、标题选择器、正文内容选择器、翻页选择器（可选）
4. 可选：配置 Cookie 或其他自定义请求头（用于需要登录的站点）
5. 点击"扫描文章" → 自动抓取列表页，提取所有文章链接 → 渲染文章列表
6. 在文章列表中勾选需要下载的内容
7. 点击"生成并下载脚本" → 下载包含抓取配置的 Python 脚本
8. 用户在本地执行脚本 → 自动遍历所有选中的文章，下载 HTML + 图片到本地

## 验收标准

### SaaSSY 预设模式（已有，编号不变）

#### Happy Path
- **AC-001**: Given 用户已登录 SaaSSY 并复制了 Cookie、accessprofile 和目录 JSON，When 粘贴三个信息并点击"解析"，Then 页面渲染出完整目录树结构，每个节点显示标题和类型
- **AC-002**: Given 目录树已渲染，When 勾选根节点 checkbox，Then 所有子节点全部自动勾选
- **AC-003**: Given 目录树中某目录被勾选，When 取消该目录勾选，Then 其所有子节点也取消勾选
- **AC-004**: Given 目录树中某目录部分子项被勾选，When 查看该目录节点，Then checkbox 显示半选状态
- **AC-005**: Given 用户已完成配置和勾选，When 点击"生成并下载脚本"，Then 浏览器下载一个包含完整目录结构 + 认证信息 + 勾选配置的 .py 文件
- **AC-006**: Given 用户已下载脚本并在本地安装 requests，When 执行 `python download_saasyy.py`，Then 脚本只下载用户勾选的内容，控制台输出下载进度
- **AC-007**: Given 脚本下载图文教程，When 调用 `getmanualdatadetail` 成功返回 HTML，Then 保存 HTML、下载所有 `<img>` 图片到 `images/` 子目录、替换引用为本地路径
- **AC-008**: Given 脚本下载视频教程，When 视频下载完成，Then MP4 文件保存到对应目录
- **AC-009**: Given 脚本运行完成，When 在本地打开 HTML 文件，Then 文字和图片均可正常显示，无需联网

#### Edge & Error Cases
- **AC-010**: Given 粘贴的目录 JSON 格式无效，When 点击"解析"，Then 显示"JSON 格式错误"提示
- **AC-011**: Given 目录 JSON 缺少 `list` 字段或 `status` 不为 `true`，When 点击"解析"，Then 显示"目录数据异常"
- **AC-012**: Given 未填写 Cookie 或 accessprofile，When 点击"生成并下载脚本"，Then 按钮禁用并提示
- **AC-013**: Given 未勾选任何内容，When 点击"生成并下载脚本"，Then 提示"请至少勾选一个下载项"
- **AC-014**: Given 脚本运行时图文下载失败，When 重试 3 次后仍失败，Then 跳过并输出"下载失败"
- **AC-015**: Given 脚本运行时视频或图片下载失败，When 重试 3 次后仍失败，Then 跳过并输出"下载失败"
- **AC-016**: Given 用户之前使用过本工具，When 再次打开页面，Then 认证信息自动填充

#### Business Rules
- **AC-017**: Cookie 和 accessprofile 保存到 localStorage
- **AC-018**: 生成的脚本包含完整的目录树 JSON，通过 selected_ids 列表运行时筛选
- **AC-019**: 图片下载到 HTML 同级目录的 `images/` 文件夹，HTML 中 src 替换为本地路径
- **AC-020**: 脚本支持 contentType=0（目录）、1（图文）、2（视频）三种节点类型

### 通用网页抓取模式（新增）

#### Happy Path
- **AC-021**: Given 用户切换到"通用网页抓取"模式，When 页面展示配置面板，Then 包含：入口 URL、文章链接 CSS 选择器、标题 CSS 选择器、正文 CSS 选择器、翻页选择器、Cookie 配置
- **AC-022**: Given 用户填写入口 URL 和必要的 CSS 选择器，When 点击"扫描文章"，Then 自动请求该 URL，解析 HTML，提取所有匹配的文章链接，显示文章列表（含标题和 URL）
- **AC-023**: Given 文章列表已渲染，When 用户勾选/取消勾选文章，Then 底部统计实时更新已选数量
- **AC-024**: Given 用户已勾选文章，When 点击"生成并下载脚本"，Then 浏览器下载一个包含抓取配置 + 已选文章 URL 列表的 Python 脚本
- **AC-025**: Given 用户已下载脚本并在本地安装 requests 和 beautifulsoup4，When 执行脚本，Then 脚本遍历已选文章，逐个请求 HTML 页面，提取正文内容并保存为 .html 文件
- **AC-026**: Given 脚本下载文章 HTML，When HTML 中包含 `<img>` 标签，Then 自动下载图片到 `images/` 子目录，src 替换为本地相对路径
- **AC-027**: Given 用户配置了翻页选择器，When 点击"扫描文章"，Then 自动遍历所有页码，收集所有页面的文章链接

#### Edge & Error Cases
- **AC-028**: Given 入口 URL 格式无效（非 http/https），When 点击"扫描文章"，Then 显示"URL 格式无效"提示
- **AC-029**: Given 入口 URL 请求超时或返回非 200 状态码，When 点击"扫描文章"，Then 显示"请求失败"提示
- **AC-030**: Given 扫描未找到任何匹配的文章链接，When 扫描完成，Then 显示"未找到匹配的文章链接，请检查 CSS 选择器"
- **AC-031**: Given 未填写任何 CSS 选择器，When 点击"扫描文章"，Then 按钮禁用并提示"请填写 CSS 选择器"
- **AC-032**: Given 未勾选任何文章，When 点击"生成并下载脚本"，Then 提示"请至少勾选一篇文章"
- **AC-033**: Given 脚本运行时某篇文章请求失败，When 重试 3 次后仍失败，Then 跳过该文章并输出"下载失败"
- **AC-034**: Given 用户之前填写过通用模式配置，When 再次切换到通用模式，Then 配置信息保持（保存在 localStorage）

#### Business Rules
- **AC-035**: 通用模式配置（入口 URL、CSS 选择器、Cookie）保存到 localStorage，key 名为 `scraping-generic-config`
- **AC-036**: 生成的抓取脚本需要依赖 `requests` 和 `beautifulsoup4` 两个 Python 库
- **AC-037**: 抓取脚本支持 `<base>` 标签处理，确保相对路径图片 URL 能正确拼接为绝对 URL
- **AC-038**: css 选择器支持标准 CSS 选择器语法（兼容 BeautifulSoup 的 `select()` 方法）

## 范围界定
- **做**: 双模式切换、通用网页抓取配置面板、CSS 选择器扫描、文章列表勾选、双模板脚本生成、配置 localStorage 保存
- **不做**: 浏览器端直接下载、模拟登录、PDF/Markdown 输出、JavaScript 渲染页面抓取（SPA 站点需要 JS 渲染的不支持）

---
## 变更日志 (Change Log)
### CR-001: 新增通用网页抓取模式 (2026-05-09)
**变更类型**: 扩展
**变更原因**: 用户需要下载除 SaaSSY 之外的其他网站（如 chanjetvip.com）的内容
**变更内容**:
- 工具从单一 SaaSSY 下载器升级为双模式（SaaSSY 预设 + 通用网页抓取）
- 新增 AC-021 至 AC-038（通用模式的 Happy Path、Edge Cases、Business Rules）
- 新增入口 URL + CSS 选择器的配置方式
- 新增基于 BeautifulSoup 的 Python 抓取脚本模板
