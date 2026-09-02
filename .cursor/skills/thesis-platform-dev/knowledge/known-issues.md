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

| 问题 | 位置 | 根因 | 建议修复 |
|------|------|------|----------|
| JSON 读写竞态 | `src/lib/repositories/json/*.ts` | read-modify-write 无锁 | 文件锁或迁 SQLite |
| ID 碰撞 | `createEntityId()` | **已修复** | 时间戳 + 随机后缀 |
| 每次操作读全文件 | storage + repository | 无缓存 | 进程内 cache + 写时 flush |

## P2 · 性能

| 问题 | 位置 | 影响 | 建议修复 |
|------|------|------|----------|
| 页面加载全量三表 | `(dashboard)/*/page.tsx` | 数据量大时慢 | 分页 API + 按需加载 |
| 客户端 filter | `*-management-panel.tsx` | 大数组 useMemo | 服务端 query + 分页 |
| Excel 导出全量 | `src/app/api/export/*` | 内存峰值 | 流式或分批 |
| GET 被 Next 缓存 | `src/app/api/*` | 默认 cache | ✅ `app/api/layout.ts` force-dynamic |

## P3 · 工程质量

- 无自动化测试
- 无 `middleware.ts`
- `replaceUrlParams` 与 Next `searchParams` 可能 hydration 不同步

## 下一期优化优先级（建议）

1. **Referential integrity** — 删改前的关联检查（最小 diff、最大减 bug）
2. **Writer load 派生** — 消除 `activeOrderCount` 漂移
3. **Repository 缓存 + 文件锁** — 低成本提升并发安全与读性能
4. **服务端分页** — 为规模增长做准备
5. **SQLite 迁移** — repository 接口已抽象，可换底层实现
