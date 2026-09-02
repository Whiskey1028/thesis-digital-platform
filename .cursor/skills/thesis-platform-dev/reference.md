# 论文数字化平台 · 参考手册

## REST API 一览

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/clients?page=1&pageSize=20&q=关键词` | 列表（可选分页/筛选） |
| POST | `/api/clients` | 创建 |
| GET/PATCH/DELETE | `/api/clients/[id]` | 单条 CRUD |
| POST | `/api/clients/[id]/create-order` | **唯一建单入口** |
| GET | `/api/orders?page=1&pageSize=20&status=in_progress` | 列表（可选分页/筛选） |
| POST | `/api/orders` | **405 禁止** |
| GET/PATCH/DELETE | `/api/orders/[id]` | 单条 CRUD |
| GET/POST | `/api/writers?page=1&pageSize=20` | 列表（可选分页）/ 创建 |
| GET/PATCH/DELETE | `/api/writers/[id]` | 单条 CRUD |
| GET | `/api/export/clients` | Excel 导出 |
| GET | `/api/export/orders` | Excel 导出（join clients + writers） |
| GET | `/api/export/writers` | Excel 导出 |

## 页面路由

| 路径 | 页面文件 | 主要组件 |
|------|----------|----------|
| `/overview` | `src/app/(dashboard)/overview/page.tsx` | `overview-filter-panel`, `overview-panels` |
| `/clients` | `src/app/(dashboard)/clients/page.tsx` | `client-management-panel`, `client-order-dialog` |
| `/orders` | `src/app/(dashboard)/orders/page.tsx` | `order-management-panel`, `order-board` |
| `/writers` | `src/app/(dashboard)/writers/page.tsx` | `writer-management-panel`, `writer-grid` |

## 数据文件

| 文件 | 实体 | 种子 |
|------|------|------|
| `data/clients.json` | Client[] | `mockClients` |
| `data/orders.json` | Order[] | `mockOrders` |
| `data/writers.json` | Writer[] | `mockWriters` |

## 关键类型枚举

- `OrderStatus`: lead → quoted → in_progress → review → delivered → after_sales
- `OrderSourceType`: self_owned | outsourced
- `PaymentStatus`: pending | partial | paid
- `RiskLevel`: low | medium | high
- `Availability`: available | busy | offline

## 本地开发

```bash
npm install
npm run dev              # http://localhost:3000
npm run import:history   # 历史 Excel 导入 → thesis.db（并刷新 JSON 种子）
npm run repair:history   # 按台账修补金额等字段 → thesis.db
npm run cli -- clients list --page 1 --page-size 10
npm run mcp:thesis       # Cursor MCP（见 .cursor/mcp.json）
```

Node.js 20+。缓存异常时删除 `.next` 后重启。

架构说明见根目录 `ARCHITECTURE.md`。
