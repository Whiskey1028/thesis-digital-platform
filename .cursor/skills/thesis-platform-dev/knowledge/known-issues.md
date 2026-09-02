# KB-002 · 已知问题与技术债

`last_verified`: 2026-09-02

## P0 · 数据完整性

| 问题 | 状态 | 说明 |
|------|------|------|
| 删客户不检查工单 | **已修复** | `client.service.deleteClient` 返回 409 |
| 删写手不检查工单 | **已修复** | `writer.service.deleteWriter` 返回 409 |
| `activeOrderCount` 可手工改 | **已修复** | 从 orders 派生，`writerInputSchema` 不含该字段 |
| 建单未快照客户字段 | **已修复** | `createOrderFromClient` 写入 school/major 等 |

## P1 · 并发与存储

| 问题 | 状态 | 说明 |
|------|------|------|
| JSON 读写竞态 | **已修复** | `proper-lockfile` + `mutateJsonFile` |
| ID 碰撞 | **已修复** | `createEntityId` 时间戳 + 随机后缀 |
| 每次操作读全文件 | **已修复** | 进程内 cache（mtime 失效） |

## P2 · 性能

| 问题 | 状态 | 说明 |
|------|------|------|
| 列表无服务端分页 | **已修复（API）** | `?page=&pageSize=&q=` + `list-queries`；RSC 页仍全量加载供 KPI |
| 客户端 filter | 部分保留 | 管理面板仍本地筛选；大列表可改走分页 API |
| Excel 导出全量 | 待办 | 流式或分批 |
| GET 被 Next 缓存 | **已修复** | `app/api/layout.tsx` `force-dynamic` |

## P3 · 工程质量

| 问题 | 状态 | 说明 |
|------|------|------|
| ESLint / Next 插件 | **已修复** | ESLint 9 + `eslint-config-next`（FlatCompat） |
| 前端 fetch 不一致 | **已修复** | CRUD 走 `apiFetch`；导出仍用 blob `fetch` |
| 无自动化测试 | 待办 | 优先测 `domain/` 与 `api/services/` |
| `replaceUrlParams` hydration | 待办 | 与 Next `searchParams` 对齐 |

## 下一期优化优先级

1. RSC 页 KPI 改为轻量聚合 API，列表区改分页拉取
2. SQLite 替换 JSON（repository 接口已抽象）
3. 单元测试 + audit log / 本地 token（Agent CRUD Phase 3）
