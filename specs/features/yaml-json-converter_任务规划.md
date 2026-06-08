# YAML/JSON 互转工具 — 任务规划

## 切片总览

```mermaid
flowchart LR
    P0[基础设施] --> P1[核心双向转换]
    P1 --> P2[文件导入/导出]
```

| 阶段 | 名称 | 完成标志（用户视角） | 预估工时 |
|------|------|---------------------|----------|
| P0 | 基础设施 | MonacoEditor 可在任意页面独立使用 | 0.5h |
| P1 | 核心双向实时转换 | 用户打开页面，在左/右任意一侧输入，另一侧自动实时转换 | 2h |
| P2 | 文件导入与导出 | 用户可导入 .yaml/.json 文件到编辑器，也可将转换结果导出为文件 | 1h |

**总计预估工时：3.5h**

---

## 阶段 0：基础设施

### T0-1: 安装 js-yaml 依赖

| 字段 | 内容 |
|------|------|
| 通俗解释 | 安装 YAML 解析库，为后续的 YAML ↔ JSON 转换提供核心能力 |
| 文件变更 | `package.json` |
| 技术方案章节 | §1 技术选型、§9 js-yaml 安装 |
| 关联 AC | — |

**验证标准：**
1. 运行 `npm ls js-yaml` 能看到 `js-yaml` 已安装
2. 运行 `npm ls @types/js-yaml` 能看到类型定义已安装
3. 在任意 `.ts` 文件中 `import * as jsYaml from 'js-yaml'` 类型检查通过，无 TS 报错

---

### T0-2: MonacoEditor 组件解耦重构

| 字段 | 内容 |
|------|------|
| 通俗解释 | 把 MonacoEditor 从 JSON 编辑器中"解放"出来，变成一个通用编辑器组件，YAML 转换器也能复用 |
| 文件变更 | `src/components/json/MonacoEditor.vue`（修改） |
| 技术方案章节 | §2 MonacoEditor 组件解耦改造 |

**修改内容：**
1. 删除 `import { useJsonEditorStore } from '@/stores/json-editor'`
2. 删除 `const jsonStore = useJsonEditorStore()`
3. 在 `onDidChangeModelContent` 回调中，删除 `jsonStore.updateContent(value)` 调用，仅保留 `emit('update:modelValue', value)`

**验证标准：**
1. MonacoEditor 组件不再引用 `jsonStore`，编译无 `jsonStore` 相关 error
2. 组件的 `v-model` 仍然正常 emit `update:modelValue` 事件
3. 组件的 `modelValue` prop 变化仍然能通过 watch 同步到编辑器内容

---

### T0-3: JsonTool.vue 适配解耦后的 MonacoEditor

| 字段 | 内容 |
|------|------|
| 通俗解释 | JSON 编辑器的代码视图不再依赖 MonacoEditor 自动更新 store，改为自己手动调用 store，确保现有功能正常 |
| 文件变更 | `src/views/JsonTool.vue`（修改） |
| 技术方案章节 | §2 影响范围 |

**修改内容：**
在 `<MonacoEditor>` 组件上，通过监听 `update:modelValue` 事件，手动调用 `jsonStore.updateContent(value)`：

```diff
- <MonacoEditor ... />
+ <MonacoEditor
+   v-model="jsonStore.content"
+   @update:model-value="jsonStore.updateContent"
+   ... />
```

**验证标准：**
1. 启动 `npm run dev`，进入 JSON 编辑器页面
2. 在代码编辑器中输入内容，右侧状态栏显示 "JSON 格式有效"
3. 输入无效 JSON，状态栏显示红色 "JSON 格式无效" 及错误信息
4. 格式化、压缩等工具栏功能正常工作
5. 切换树状/表单/预览/表格视图正常工作，数据同步正确

---

## 阶段 1：核心双向实时转换

### T1-1: 创建 yaml-converter Pinia Store

| 字段 | 内容 |
|------|------|
| 通俗解释 | 创建转换器的"大脑"——负责管理两侧编辑器的内容、实时转换逻辑、错误状态和防抖控制 |
| 文件变更 | `src/stores/yaml-converter.ts`（新增） |
| 技术方案章节 | §3 Pinia Store 设计 |
| 关联 AC | AC-002, AC-003, AC-006, AC-007, AC-008, AC-009, AC-010, AC-012, AC-014, AC-015 |

**核心逻辑说明：**
- `onYamlChange(value)`：更新 `yamlContent` → 500ms 防抖 → `js-yaml.load()` 解析 → `JSON.stringify()` → 更新 `jsonContent`
- `onJsonChange(value)`：更新 `jsonContent` → 500ms 防抖 → `JSON.parse()` 解析 → `js-yaml.dump()` → 更新 `yamlContent`
- 解析失败时**不清空**另一侧，仅保留错误状态
- 空内容时双向清空
- 多文档 YAML：`js-yaml.load()` 返回数组 → `JSON.stringify` 输出为 JSON 数组
- JSON 数组 → `js-yaml.dump()` 自动输出为 `---` 分隔的多文档 YAML

**验证标准：**
1. `onYamlChange('name: test')` 调用 500ms 后，`jsonContent` 变为 `{\n  "name": "test"\n}`，`yamlValid` 为 `true`，`errorMessage` 为空
2. `onJsonChange('{"name":"test"}')` 调用 500ms 后，`yamlContent` 变为 `name: test\n`，`jsonValid` 为 `true`
3. `onYamlChange('invalid: [')` 调用后，`jsonContent` 保留上次有效值不变，`yamlValid` 为 `false`，`errorMessage` 包含 "YAML 解析错误"
4. `onYamlChange('')` 调用后，`yamlContent` 和 `jsonContent` 均为空字符串
5. `onYamlChange("a: 1\n---\nb: 2")` 调用后，`jsonContent` 为 `[\n  {\n    "a": 1\n  },\n  {\n    "b": 2\n  }\n]`
6. `onJsonChange('[{"a":1},{"b":2}]')` 调用后，`yamlContent` 包含 `---` 分隔的多文档格式
7. `onYamlChange` 触发后 `activeSide` 为 `'yaml'`，`onJsonChange` 触发后 `activeSide` 为 `'json'`
8. YAML 含锚点 `default: &d {x: 1}\nspec: *d` 时，转换后 JSON 展开为 `{"default": {"x": 1}, "spec": {"x": 1}}`

---

### T1-2: 创建 YamlConverterView 主页面组件

| 字段 | 内容 |
|------|------|
| 通俗解释 | 创建转换器的主体页面——左右双栏编辑器 + 顶部工具栏 + 底部状态栏，用户看到的就是它 |
| 文件变更 | `src/components/yaml-converter/YamlConverterView.vue`（新增） |
| 技术方案章节 | §4 组件结构 |
| 关联 AC | AC-001, AC-011, AC-016 |

**页面结构：**

```
┌────────────────────────────────────────────────────────────┐
│  工具栏: [← 返回]  [导入]  [导出]   状态: ✓ 格式有效       │
├──────────────────────────┬─────────────────────────────────┤
│  MonacoEditor             │  MonacoEditor                  │
│  language="yaml"          │  language="json"               │
│  v-model="yamlContent"    │  v-model="jsonContent"         │
│  @update:model-value      │  @update:model-value           │
│     =onYamlChange         │     =onJsonChange              │
├──────────────────────────┴─────────────────────────────────┤
│  状态栏: YAML 行:5 列:1 | JSON 行:3 列:10 | 格式有效      │
└────────────────────────────────────────────────────────────┘
```

**关键实现要点：**
- 顶部工具栏区域显示标题 "YAML/JSON 互转"、导入/导出按钮
- 错误状态时在顶部显示红色错误条：内容为 `errorMessage`，标注错误发生在哪一侧
- 左右两栏各占 50% 宽度，中间可拖拽分隔条调整比例
- 底部状态栏显示两侧的行/列/字符数、格式有效性状态

**验证标准：**
1. 页面加载后呈现左右两栏布局，左侧编辑器语言模式为 YAML（语法高亮为 YAML 风格），右侧为 JSON
2. 顶部工具栏包含"导入"和"导出"按钮，标题为"YAML/JSON 互转"
3. 在左侧输入 YAML，右侧 500ms 后自动显示 JSON；在右侧输入 JSON，左侧 500ms 后自动显示 YAML
4. 当有错误时，顶部显示红色错误提示条，内容包含错误类型和位置
5. 无错误时顶部错误条隐藏，状态栏显示"格式有效"
6. 左侧内容清空后右侧同步清空，反之亦然
7. 中间分隔条可拖拽调整左右宽度比例

---

### T1-3: 创建路由入口 + 注册路由 + 更新导航

| 字段 | 内容 |
|------|------|
| 通俗解释 | 让用户能从导航栏和侧边栏点进去使用 YAML/JSON 转换器，和 JSON 编辑器并列 |
| 文件变更 | `src/views/YamlConverterTool.vue`（新增）、`src/router/index.ts`（修改）、`src/components/layout/AppHeader.vue`（修改）、`src/components/layout/AppSidebar.vue`（修改） |
| 技术方案章节 | §5 路由配置、§6 导航配置更新 |

**修改内容：**

1. **新增** `src/views/YamlConverterTool.vue`：路由入口页面，引入并渲染 `YamlConverterView`

```vue
<script setup lang="ts">
import YamlConverterView from '@/components/yaml-converter/YamlConverterView.vue'
</script>
<template>
  <YamlConverterView />
</template>
```

2. **修改** `src/router/index.ts`：新增路由

```typescript
{
  path: '/yaml-json',
  name: 'yaml-json',
  component: () => import('@/views/YamlConverterTool.vue'),
  meta: {
    title: 'YAML/JSON 互转',
    icon: '⇄',
  },
}
```

3. **修改** `src/components/layout/AppHeader.vue`：新增导航项

```typescript
{ id: 'yaml-json', name: 'YAML/JSON', icon: '⇄', route: '/yaml-json', disabled: false }
```

4. **修改** `src/components/layout/AppSidebar.vue`：在"数据转换"分组新增

```typescript
{ id: 'yaml-json', name: 'YAML/JSON 互转', icon: '⇄', route: '/yaml-json', desc: 'YAML 与 JSON 双向实时转换' }
```

**验证标准：**
1. 访问 `/yaml-json` 路由，页面正确渲染 YamlConverterView 组件
2. 顶部导航栏中显示"YAML/JSON"导航项，点击后切换到转换器页面
3. 侧边栏"数据转换"分组下显示"YAML/JSON 互转"项，点击后切换到转换器页面
4. 导航栏和侧边栏中当前激活项高亮样式正确
5. 从转换器页面切换到 JSON 编辑器页面正常工作，路由切换无报错

---

## 阶段 2：文件导入与导出

### T2-1: 实现文件导入功能

| 字段 | 内容 |
|------|------|
| 通俗解释 | 用户点击"导入"按钮，选择本地 .yaml/.yml/.json 文件，文件内容自动填入编辑器对应侧，另一侧自动完成转换 |
| 文件变更 | `src/components/yaml-converter/YamlConverterView.vue`（修改） |
| 技术方案章节 | §7 文件导入/导出实现 |
| 关联 AC | AC-004, AC-013 |

**验证标准：**
1. 点击"导入"按钮，弹出文件选择对话框，文件类型过滤为 `.yaml`、`.yml`、`.json`
2. 选择 `.yaml` 文件后，内容填入左侧 YAML 编辑器，右侧自动显示转换后的 JSON
3. 选择 `.json` 文件后，内容填入右侧 JSON 编辑器，左侧自动显示转换后的 YAML
4. 选择 `.json` 文件后，导入后**立即转换**（无需等待 500ms 防抖）
5. 文件大小超过 1MB 时，显示"内容过大，建议分段处理"的提示，不阻塞页面

---

### T2-2: 实现文件导出功能

| 字段 | 内容 |
|------|------|
| 通俗解释 | 用户点击"导出"按钮，选择导出为 YAML 或 JSON 格式，浏览器自动下载文件 |
| 文件变更 | `src/components/yaml-converter/YamlConverterView.vue`（修改） |
| 技术方案章节 | §7 文件导入/导出实现 |
| 关联 AC | AC-005 |

**验证标准：**
1. 点击"导出"按钮，弹出选择菜单（或下拉选项）："导出为 YAML" / "导出为 JSON"
2. 选择"导出为 YAML"后，下载文件 `converted.yaml`，内容为左侧编辑器的 YAML 内容
3. 选择"导出为 JSON"后，下载文件 `converted.json`，内容为右侧编辑器的 JSON 内容
4. 当一侧编辑器为空时，导出对应格式的文件内容为空字符串

---

## AC 覆盖总表

| AC | 所属阶段 | 任务 |
|----|----------|------|
| AC-001 — 页面布局 | P1 | T1-2 YamlConverterView |
| AC-002 — YAML → JSON 实时转换 | P1 | T1-1 Pinia Store |
| AC-003 — JSON → YAML 实时转换 | P1 | T1-1 Pinia Store |
| AC-004 — 从文件导入 | P2 | T2-1 导入功能 |
| AC-005 — 导出为文件 | P2 | T2-2 导出功能 |
| AC-006 — 多文档 YAML 转 JSON | P1 | T1-1 Pinia Store |
| AC-007 — JSON 数组转多文档 YAML | P1 | T1-1 Pinia Store |
| AC-008 — YAML 锚点支持 | P1 | T1-1 Pinia Store（js-yaml 原生） |
| AC-009 — YAML 语法错误保留上次 JSON | P1 | T1-1 Pinia Store |
| AC-010 — JSON 语法错误保留上次 YAML | P1 | T1-1 Pinia Store |
| AC-011 — 错误提示位置与内容 | P1 | T1-2 YamlConverterView |
| AC-012 — 空内容处理 | P1 | T1-1 Pinia Store |
| AC-013 — 超大文件处理 | P2 | T2-1 导入功能 |
| AC-014 — 转换方向自动检测 | P1 | T1-1 Pinia Store（activeSide） |
| AC-015 — 转换触发时机（500ms） | P1 | T1-1 Pinia Store |
| AC-016 — 编辑器语言模式 | P1 | T1-2 YamlConverterView |

---

## 执行顺序建议

建议按 **P0 → P1 → P2** 顺序执行：

1. **P0** 是基础改造，完成后方可进入 P1
2. **P1** 是核心功能，完成后即可验证所有转换逻辑
3. **P2** 是增量功能，在核心转换可用基础上追加文件操作能力

如果希望快速看到效果，也可以先完成 P1 再进行 P0 — 即**先新建 Store 和 View（使用独立的未解耦的编辑器逻辑），再回来改造 MonacoEditor**。但 P0 越早做，后续其他工具的开发成本越低。
