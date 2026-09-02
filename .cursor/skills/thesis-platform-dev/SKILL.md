---
name: thesis-platform-dev
description: >-
  论文数字化平台（Next.js 15 + TypeScript）开发咨询与实现规范：客户/工单/写手 CRUD、
  总览分析、Repository 层、REST API、Zod 校验、JSON 存储、Excel 导入导出。
  在用户问如何实现某功能、接口在哪、数据模型、业务规则、bug 修复、性能优化时自动启用。
---

# 论文数字化平台 · 开发 Skill

Skill 根目录：`.cursor/skills/thesis-platform-dev/`。

## 0. 先查知识库

1. 读 [knowledge/INDEX.md](knowledge/INDEX.md) 按关键词匹配。
2. 命中则读对应 `knowledge/*.md`；仍须用代码抽样验证。
3. 详细 API/文件路由见 [reference.md](reference.md)。

## 架构速览

详见根目录 [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)。

```
Route Handler  →  lib/api/services  →  repositories  →  data/*.json
Page (RSC)     →  lib/queries       →  repositories
Client UI      →  lib/client/api-fetch  →  /api/*
```

## 2. 问题类型分流

| 类型 | 信号 | 优先调查 |
|------|------|----------|
| **A 数据模型/字段** | 类型、枚举、校验规则 | `src/lib/types.ts` + `src/lib/validation.ts` |
| **B API/调用链** | 接口、CRUD、错误码 | codegraph + `src/app/api/**/route.ts` |
| **C 前端/UI** | 页面、弹窗、筛选 | `src/components/<domain>/` + 对应 `src/app/(dashboard)/` |
| **D 业务规则** | 先客户后工单、派单 | [knowledge/domain-rules.md](knowledge/domain-rules.md) + README |
| **E 已知问题/优化** | bug、性能、并发 | [knowledge/known-issues.md](knowledge/known-issues.md) |
| **F 历史数据** | Excel 导入、清洗 | `scripts/import-history.mjs`、`scripts/repair-history-data.mjs` |

## 3. 后端调查 — codegraph

```
codegraph_context(task=<业务域 + 动作>)
  → 流程：codegraph_trace(from=..., to=...)
  → 补源码：codegraph_explore(query=<符号名>)
```

索引未就绪：`codegraph_status`；必要时 `codegraph init -i`。

## 4. 实现约定

### 响应

- 成功：`{ data: T }` 或删除成功 `{ ok: true }`
- 失败：`{ error: { code, message, details? } }`

### 新增字段流程

1. `src/lib/types.ts` — 类型
2. `src/lib/validation.ts` — Zod schema
3. Repository（通常无需改接口，Partial update 已支持）
4. API route — 映射入参/出参
5. 前端 form / table — 展示与编辑
6. `src/lib/mock-data.ts` — 种子数据（若影响首次启动）
7. `scripts/import-history.mjs` — 若影响历史导入

### 禁止事项

- ❌ 绕过 repository 直接 `readJsonFile` / `writeJsonFile`（storage 层仅 repository 可调）
- ❌ 新增 `POST /api/orders` 建单路径（业务铁律：只能从客户创建）
- ❌ 删除客户/写手时不检查关联工单（当前已知缺口，修复时应做级联或拦截）
- ❌ 用 `Date.now()` 以外的随意 ID 格式（保持 `cli_` / `ord_` / `wri_` 前缀惯例）

## 5. 性能优化指引

当前瓶颈（详见 known-issues）：

| 问题 | 改法 |
|------|------|
| 每页加载全量三表 | 服务端分页 + 按需 fetch；或迁 SQLite 后 indexed query |
| 每次 getById 重读整文件 | repository 层加内存缓存 + 写时失效 |
| 并发写 JSON 竞态 | 文件锁（`proper-lockfile`）或迁 SQLite |
| 客户端全量 filter | 服务端 query params + repository 过滤 |

## 6. 输出格式

```markdown
## 问题理解
（一句话）

## 现有实现
- 事实 + 文件路径

## 建议做法
1. …

## 注意
（业务铁律、已知缺口）
```

## 7. 解答后 — 知识沉淀

满足以下任一即更新 `knowledge/*.md` + `INDEX.md`：

- 新的业务规则结论
- 确认的 bug 根因
- 接口/字段变更记录
- 高频重复问题
