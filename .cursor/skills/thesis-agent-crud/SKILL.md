---
name: thesis-agent-crud
description: >-
  通过 Cursor Agent / MCP / CLI 对论文数字化平台执行本地 CRUD：客户、工单、写手增删改查。
  在用户要求用 Agent 改数据、不用 Web UI、MCP 集成、CLI 脚本、curl 操作业务数据时启用。
---

# 论文平台 · Agent CRUD

## 前置条件

- Node.js 20+
- **主存储**：`data/thesis.db`（SQLite）；`data/*.json` 仅空库种子 / 导入备份
- 业务铁律见 [thesis-platform-dev/knowledge/domain-rules.md](../thesis-platform-dev/knowledge/domain-rules.md)

## 日常口述建单（推荐对 Agent 怎么说）

用户可自然语言描述，例如：

> 今天接了个单：客户小王，微信 wx_wang，本科，XX大学计算机，题目《…》，自接，全套，报价 3800，已付 1000，截止日期 2026-10-01，负责人自营。

Agent 应按顺序：

1. 查是否已有客户（`npm run cli -- clients list --q 小王` 或 MCP `list_clients`）
2. 没有则先 `clients create`
3. 再 `orders create --client-id <id>`（**唯一合法建单路径**）
4. 回读确认并告知用户 id

缺字段时用合理默认（如 risk=medium、urgency=medium），并在回复里列出假设。

## 方式 A · REST API（dev server 运行时）

启动：`npm run dev`（若 3000 被占用则看终端实际端口）

### 常用操作

```bash
curl -s http://localhost:3003/api/clients | jq .
curl -s -X POST http://localhost:3003/api/clients \
  -H 'Content-Type: application/json' \
  -d '{"name":"测试客户","contactHandle":"wx_test",...}'

curl -s -X POST http://localhost:3003/api/clients/cli_xxx/create-order \
  -H 'Content-Type: application/json' \
  -d '{"title":"论文题目","serviceType":"全套",...}'
```

完整字段：`src/lib/validation.ts`。

## 方式 B · 禁止直接改文件

**禁止**直接写 `data/*.json` 或手改 SQLite 当主路径。必须走 Service / CLI / MCP / API。

## 方式 C · CLI（推荐，无需 Web）

```bash
npm run cli -- clients list [--page N] [--page-size N] [--q text]
npm run cli -- clients create --json payload.json
npm run cli -- orders create --client-id <id> --json payload.json
npm run cli -- orders list --page 1 --page-size 20
# writers 同理
```

## 方式 D · MCP Server

`.cursor/mcp.json` 已配置；重启 Cursor 后可用 `create_client` / `create_order_for_client` 等 tools。

本地调试：`npm run mcp:thesis`

## Agent 操作 checklist

1. **建单** → 必须先有 `clientId`
2. **删客户/写手** → 有关联工单会 409
3. **改财务** → amount / settled / receivable / profit 口径一致
4. **派单** → 改 `Order.writerId`，勿手工改 `activeOrderCount`
5. **证明成功** → 操作后 GET / CLI get 确认

## 反模式

- ❌ `POST /api/orders` 建单（405）
- ❌ 直接改 JSON / 裸 SQL 写业务数据
- ❌ 删除有关联工单的客户而不告知用户
