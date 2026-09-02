# 架构说明

本仓库采用 **Next.js 15 App Router 分层架构**，参考以下来源综合落地：

| 来源 | 采纳要点 |
|------|----------|
| [Next.js Route Handlers / Stanza](https://www.stanza.dev/concepts/nextjs-route-handlers) | 边界 Zod 校验、结构化错误、正确 HTTP 状态码 |
| [Jagatjeet — API Design Patterns](https://jagatjeet.com/blog/api-design-patterns-nextjs) | 在 Route Handler 入口 validate-at-boundary，业务层只接收已校验数据 |
| [Groovy Web — 2026 Full-Stack Structure](https://www.groovyweb.co/blog/nextjs-project-structure-full-stack) | `app/` 薄编排、`lib/` 承载核心逻辑、Server Component 默认 |
| [Feature-Sliced Design × App Router](https://feature-sliced.design/blog/nextjs-app-router-guide) | 路由层不堆业务；领域逻辑下沉到 `lib/` |

## 分层结构

```
src/
├── app/                          # 路由层（薄编排）
│   ├── (dashboard)/              # Server Components 页面
│   └── api/                      # REST Route Handlers（仅 HTTP 适配）
│       └── layout.tsx            # force-dynamic，避免 JSON 数据被缓存
├── components/                   # UI（Client / 展示组件）
└── lib/
    ├── api/                      # HTTP 边界层
    │   ├── errors.ts             # ApiError 结构化错误
    │   ├── parse-request.ts      # Zod 解析 body / params
    │   ├── responses.ts          # jsonData / runRoute / toErrorResponse
    │   ├── ids.ts                # 实体 ID 生成
    │   └── services/             # 业务用例（Use Cases）
    ├── client/                   # 浏览器端工具
    │   └── api-fetch.ts          # 统一 fetch + 错误解析
    ├── domain/                   # 纯领域规则（无 I/O）
    ├── queries/                  # Server 读模型（RSC / 导出用）
    ├── repositories/             # 持久化抽象 + JSON 实现
    ├── server/                   # 服务端基础设施（storage、excel）
    ├── types.ts                  # 领域类型
    └── validation.ts             # Zod schemas（API 与文档契约）
```

## 依赖方向（单向）

```
Route Handler  →  api/services  →  repositories  →  server/storage
                      ↓
                  domain / queries（纯函数或读模型组合）
Page (RSC)       →  queries / repositories（不经 Route Handler）
Client Component →  fetch /api/*  →  Route Handler
```

**禁止**：Route Handler 直接操作 `storage`；Client Component 直接读 `data/*.json`。

## API 约定

### 请求

- Body：`parseJsonBody(request, schema)`，失败 → `400 VALIDATION_ERROR`
- 动态路由 params：`parseRouteParams`，失败 → `400`
- Next.js 15：`params` 为 `Promise`，必须 `await`

### 响应

| 场景 | 形状 | 状态码 |
|------|------|--------|
| 成功（有数据） | `{ data: T }` | 200 / 201 |
| 成功（无 body） | `{ ok: true }` | 200 |
| 校验失败 | `{ error: { code, message, details } }` | 400 |
| 未找到 | `{ error: { code: "NOT_FOUND", ... } }` | 404 |
| 冲突（有关联数据） | `{ error: { code: "CONFLICT", ... } }` | 409 |
| 方法不允许 | `{ error: { code: "METHOD_NOT_ALLOWED", ... } }` | 405 |

### 业务规则（Service 层 enforce）

- 工单只能从客户创建（`createOrderFromClient`）
- 删除客户/写手前检查关联工单（409）
- 写手 `activeOrderCount` 由 `queries/writers` 从工单派生，不持久化手工值

## Server vs Client

- **默认 Server Component**：dashboard 页面在服务端加载数据。
- **`"use client"`** 仅用于交互（表单、弹窗、筛选）。
- **`server-only`** 标记所有不可暴露到客户端的模块（services、queries、storage）。

## 工具链

```bash
npm run dev          # 开发
npm run build        # 生产构建（含类型检查）
npm run lint         # ESLint（eslint-config-next + typescript-eslint + Prettier）
npm run format       # Prettier 格式化
npm run cli -- ...   # 本地 CRUD（无需启动 Next）
npm run mcp:thesis   # MCP stdio server（Cursor `.cursor/mcp.json`）
```

### Agent 入口（复用同一套 `api/services`）

| 入口 | 路径 |
|------|------|
| CLI | `scripts/thesis-cli.ts` |
| MCP | `mcp/thesis-platform/index.ts` + `.cursor/mcp.json` |
| REST | `src/app/api/**` |

列表支持可选分页：`?page=&pageSize=&q=`（未传 page 时仍返回全量数组，兼容现有 UI）。

## 演进方向

1. RSC 页 KPI 改为轻量聚合；管理列表改走分页 API
2. Repository 换 SQLite（接口不变）
3. 关键路径单元测试：`domain/`、`api/services/`、`validation.ts`
4. Agent Phase 3：本地 token + audit log