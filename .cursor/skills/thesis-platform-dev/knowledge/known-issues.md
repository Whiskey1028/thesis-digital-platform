# KB-002 · 已知问题与技术债

`last_verified`: 2026-09-02

## P0 · 数据完整性

| 问题 | 状态 | 说明 |
|------|------|------|
| 删客户不检查工单 | **已修复** | Service 层 409 |
| 删写手不检查工单 | **已修复** | Service 层 409 |
| `activeOrderCount` 漂移 | **已修复** | SQL 子查询派生 |
| 建单未快照客户字段 | **已修复** | Order 快照字段 |

## P1 · 存储

| 问题 | 状态 | 说明 |
|------|------|------|
| JSON 读写竞态 | **已替代** | 主存储迁 SQLite |
| 并发迁移重复种子 | **已修复** | `.thesis-migrate.lock` + 双重 COUNT 检查 |
| ID 碰撞 | **已修复** | `createEntityId` |

## P2 · 性能

| 问题 | 状态 | 说明 |
|------|------|------|
| 管理页全量加载 | **已修复** | RSC + URL 分页，SQL `LIMIT/OFFSET` |
| 总览页全量加载 | **已修复** | URL 筛选 + SQL 聚合（`src/lib/queries/overview.ts`） |
| 导入只写 JSON | **已修复** | `import:history` / `repair:history` → `replaceSqliteDataset` |
| 工单泳道全量 | **已优化** | 每状态计数 + 最多 8 条样例 |
| Excel 导出全量 | 待办 | 流式或分批 |

## P3 · 工程质量

| 问题 | 状态 | 说明 |
|------|------|------|
| 无自动化测试 | 待办 | — |
| 无 auth | 待办 | 本地应用，不做 token |
