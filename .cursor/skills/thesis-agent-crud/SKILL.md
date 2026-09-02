---
name: thesis-agent-crud
description: >-
  通过 Cursor Agent / MCP / CLI 对论文数字化平台执行本地 CRUD：客户、工单、写手增删改查。
  在用户要求用 Agent 改数据、不用 Web UI、MCP 集成、CLI 脚本、curl 操作业务数据时启用。
---

# 论文平台 · Agent CRUD

## 前置条件

- Node.js 20+
- 数据目录：`data/*.json`（gitignore，首次运行从 mock 种子初始化）
- 业务铁律见 [thesis-platform-dev/knowledge/domain-rules.md](../thesis-platform-dev/knowledge/domain-rules.md)

## 方式 A · REST API（dev server 运行时）

启动：`npm run dev` → `http://localhost:3000`

### 常用操作

```bash
# 列表
curl -s http://localhost:3000/api/clients | jq .
curl -s http://localhost:3000/api/orders | jq .
curl -s http://localhost:3000/api/writers | jq .

# 创建客户
curl -s -X POST http://localhost:3000/api/clients \
  -H 'Content-Type: application/json' \
  -d '{"name":"测试客户","contactHandle":"wx_test",...}'

# 从客户建单（唯一合法建单路径）
curl -s -X POST http://localhost:3000/api/clients/cli_xxx/create-order \
  -H 'Content-Type: application/json' \
  -d '{"title":"论文题目","serviceType":"全套",...}'

# 更新工单
curl -s -X PATCH http://localhost:3000/api/orders/ord_xxx \
  -H 'Content-Type: application/json' \
  -d '{"status":"in_progress"}'

# 删除
curl -s -X DELETE http://localhost:3000/api/clients/cli_xxx
```

完整字段与校验规则：`src/lib/validation.ts`。

### 响应格式

- 成功：`{ "data": ... }`
- 失败：`{ "error": "..." }` 或 Zod flatten

## 方式 B · 直接编辑 JSON（不推荐）

仅紧急只读查看时可 `Read data/clients.json`。**禁止** Agent 直接 `writeJsonFile` 绕过校验——易破坏 ID 引用与 Zod 约束。

## 方式 C · CLI（推荐）

```bash
npm run cli -- clients list [--page N] [--page-size N] [--q text]
npm run cli -- clients get <id>
npm run cli -- clients create --json payload.json
npm run cli -- clients update <id> --json payload.json
npm run cli -- clients delete <id>

npm run cli -- orders create --client-id <id> --json payload.json
npm run cli -- orders list --page 1 --page-size 20
# writers 同理
```

无需启动 dev server，直接复用 `api/services` 与 Zod 校验。

## 方式 D · MCP Server（Cursor 原生）

项目已配置 `.cursor/mcp.json`，重启 Cursor 后可用 tools：

- `list_clients` / `get_client` / `create_client` / `update_client` / `delete_client`
- `list_orders` / `get_order` / `create_order_for_client` / `update_order` / `delete_order`
- `list_writers` / `get_writer` / `create_writer` / `update_writer` / `delete_writer`

本地调试：`npm run mcp:thesis`

## Agent 操作 checklist

1. **建单** → 必须先有 `clientId`，走 `create_order_for_client` / CLI `orders create --client-id` / `POST .../create-order`
2. **删客户/写手** → Service 层会 409 拦截有关联工单；收到 CONFLICT 时先处理工单
3. **改财务** → 保持 amount/settled/receivable/profit 口径一致
4. **改 writer load** → 优先通过派单改 `Order.writerId`，勿手工改 `activeOrderCount`
5. **证明成功** → 操作后 GET 对应资源确认

## 反模式

- ❌ `POST /api/orders` 建单（405）
- ❌ 直接改 `data/*.json` 写入
- ❌ 删除有关联工单的客户而不告知用户
