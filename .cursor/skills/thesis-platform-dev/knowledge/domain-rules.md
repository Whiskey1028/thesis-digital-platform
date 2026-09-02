# KB-001 · 业务铁律与协作规则

`last_verified`: 2026-09-02

## 核心流程

1. **客户是入口** — 所有履约从客户档案开始。
2. **工单绑定客户** — `Order.clientId` 必填；创建时通过 `POST /api/clients/[id]/create-order`。
3. **禁止游离建单** — `POST /api/orders` 返回 405，前端不提供无客户建单入口。
4. **写手独立池** — `Writer` 与客户无直接外键；工单通过 `Order.writerId` 关联。

## 建单时的数据流

```
Client 档案
  → createOrderDraftFromClient()（src/lib/server/order-drafts.ts）
  → 用户在前端弹窗补充/修改
  → POST /api/clients/[id]/create-order
  → repositories.orders.create()
```

建单时会从客户带入 `sourceChannel`；**当前未快照** `schoolType`、`school`、`educationLevel`、`major`、`clientName` 到 Order（Excel 导出时会回查 live client）。

## 删除语义（当前）

| 操作 | 行为 | 风险 |
|------|------|------|
| 删客户 | 直接移除，不检查关联工单 | 工单 orphaned `clientId` |
| 删写手 | 直接移除，不检查关联工单 | 工单 orphaned `writerId` |
| 删工单 | 直接移除 | 无级联影响 |

**修复方向**：删除前检查关联 + 拦截或级联；Writer `activeOrderCount` 应从 orders 派生而非手工维护。

## 财务字段口径

- `amount` — 成交金额
- `settledAmount` — 已结算
- `receivableAmount` — 应收
- `costAmount` — 成本（转包单重点）
- `profitAmount` — 利润
- `paymentStatus` — pending / partial / paid

总览页聚合逻辑在 `src/lib/analytics.ts`，修改字段时需同步检查。
