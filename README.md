# 数据字典前端（data-dict-frontend）

## 项目概述

这是一个基于 Vue 3 + TypeScript 的单页应用，用于管理与检索“标准字段”和“词根”的数据字典系统。包含：公共查询门户与管理员后台（字段管理、词根管理、用户与任务管理）。

## 技术栈

- Vue 3 (组合式 API)
- TypeScript
- Vite
- Element Plus (UI)
- Pinia (状态管理)
- Vue Router
- Axios (HTTP 客户端)
- xlsx (导出)

## 目录与架构概览

- `src/main.ts`：应用入口，注册路由、Element Plus、Pinia。
- `src/router/index.ts`：路由配置与全局路由守卫（标题、登录/角色检查）。
- `src/api/index.ts`：Axios 实例、请求/响应拦截器与后端接口封装（`dictionaryApi`）。
- `src/store/`：Pinia store（例如 `task.ts` 提供未处理任务数刷新）。
- `src/views/`：各页面视图（如 `UserSearch.vue`、`StandardFieldList.vue`、`WordRootList.vue`、`TaskManagement.vue`、`UserManagement.vue` 等）。
- `src/layouts/`：后台布局（`AdminLayout.vue`）。
- `src/components/`：复用组件（例如 `TaskAnalyzer.vue`）。
- `src/utils/logger.ts`：轻量日志封装，按环境控制等级。
- `src/types/`：共享类型定义。

查看主要文件：

- 路由：[src/router/index.ts](src/router/index.ts)
- API 客户端：[src/api/index.ts](src/api/index.ts)
- 入口：[src/main.ts](src/main.ts)
- 示例视图（字段管理）：[src/views/StandardFieldList.vue](src/views/StandardFieldList.vue)
- Store 示例：[src/store/task.ts](src/store/task.ts)
- 日志：[src/utils/logger.ts](src/utils/logger.ts)

## 关键逻辑与函数说明

1. API 客户端（`src/api/index.ts`）
   - 创建 `axios` 实例并设置 `baseURL` 为 `/api`（配合 Vite 代理）。
   - 请求拦截器：自动从 `localStorage` 注入 `Authorization`（Bearer token），并使用 `logger` 打印请求。 
   - 响应拦截器：统一处理错误（尤其 401/403 会清空本地缓存并跳转到登录页），并弹出友好提示。 
   - 暴露 `dictionaryApi` 对象：封装后端接口（登录/注册、公共查询、词根/字段的 CRUD、智能建议、导出/批量、任务接口等）。

2. 路由与权限控制（`src/router/index.ts`）
   - 定义公共页与 `/admin` 嵌套路由（字段、词根、任务、用户）。
   - 全局守卫负责：设置页面标题、校验 token、确认 `admin` 角色，未登录或权限不足会做重定向或提示。

3. 状态管理（示例：`src/store/task.ts`）
   - `useTaskStore` 提供 `unprocessedCount` 与 `refreshCount()`，通过 `dictionaryApi.getTaskCount()` 获取后端统计并更新状态。

4. 字段管理视图（`src/views/StandardFieldList.vue`）——核心交互流程：
   - 列表加载：`fetchFields()` 调用 `dictionaryApi.getFields()`，更新 `fields` 与 `total`。
   - 搜索节流：`handleSearch()` 使用 400ms 防抖触发列表刷新。
   - 智能解析：`handleAnalyze()`（400ms 防抖）调用 `dictionaryApi.getSuggest()` 获得 `segments`，并将候选词根渲染成选择矩阵。
   - 选择词根：`selectRoot(index, root)` 记录 `selectedRootIds` 与 `selectedRoots`，并 `syncToForm()` 更新 `form.field_en_name` 与 `composition_ids`。
   - 预览与校验：`previewParts` 计算预测英文名，`isSelectionComplete` 确保每个分段都有选中词根才允许保存。
   - 新增/编辑/删除：`submitForm()` 调用 `createField` 或 `updateField`；`handleDelete()` 调用 `deleteField()`；操作后刷新列表。
   - 导出：`handleExport()` 使用 `xlsx` 把查询结果导出为 Excel 文件。
   - 清空：`handleClearAll()` 触发高危确认后调用 `clearAllFields()`，并刷新。

5. 日志（`src/utils/logger.ts`）
   - 简易日志工具：按环境（DEV/PROD）过滤等级，提供 `debug/info/warn/error` 方法，便于在开发时追踪请求与关键行为。

## 本地运行

安装依赖并启动开发服务器：

```bash
npm install
npm run dev
```

可用脚本（见 `package.json`）：

- `dev`：启动 Vite 开发服务器
- `build`：类型检查并构建生产包
- `preview`：预览构建产物

注意：前端将 `/api` 代理到后端（开发时通过 Vite 代理配置），生产环境请确保后端部署在对应路径或修改 `baseURL`。

## 常见扩展点 / 开发提示

- 权限体系：目前基于 `localStorage` 的 `token` 与 `role`。若需更安全的实现，可在服务器端使用短期 token + 刷新机制并将敏感信息放入 HttpOnly cookie。
- 国际化：UI 文案为中文，可考虑引入 `vue-i18n` 做多语言支持。
- 错误上报：可将 `logger.error` 扩展到远程错误收集服务（Sentry 等）。
- 单元/集成测试：推荐为 API 封装和关键 UI 行为添加测试。

---



