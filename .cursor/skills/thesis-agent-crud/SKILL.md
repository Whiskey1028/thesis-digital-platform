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

## 方式 C · CLI 脚本（规划中）

路线图见 [agent-crud-roadmap.md](../thesis-platform-dev/knowledge/agent-crud-roadmap.md)。

实现 `scripts/thesis-cli.mjs` 后，Agent 优先用 CLI（无需 dev server，走同一套 validation）。

## 方式 D · MCP Server（规划中）

MCP tools 封装 REST 或 repository 调用；配置后 Cursor 可直接 `@thesis-platform` 操作。

## Agent 操作 checklist

1. **建单** → 必须先有 `clientId`，走 `POST /api/clients/[id]/create-order`
2. **删客户/写手** → 当前无关联检查，操作前用 orders list 确认无引用
3. **改财务** → 保持 amount/settled/receivable/profit 口径一致
4. **改 writer load** → 优先通过派单改 `Order.writerId`，勿手工改 `activeOrderCount`
5. **证明成功** → 操作后 GET 对应资源确认

## 反模式

- ❌ `POST /api/orders` 建单（405）
- ❌ 直接改 `data/*.json` 写入
- ❌ 删除有关联工单的客户而不告知用户
