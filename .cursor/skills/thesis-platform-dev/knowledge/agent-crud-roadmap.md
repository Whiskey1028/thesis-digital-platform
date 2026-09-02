# KB-003 · Agent 本地 CRUD 路线图

`last_verified`: 2026-09-02

## 目标

让本地用户通过 Cursor 等 Agent 工具**直接增删改查**客户/工单/写手数据，而不依赖 Web UI。

## 当前能力（已可用）

Agent 已可通过以下方式操作数据：

| 方式 | 适用 | 限制 |
|------|------|------|
| **REST API** | `curl` / Agent `fetch` | 需 dev server 运行；无 auth |
| **直接改 JSON** | 编辑 `data/*.json` | 绕过校验；易破坏一致性；不推荐 |
| **Repository 脚本** | 新建 `scripts/agent-*.mjs` | 可复用 Zod + repository 逻辑 |

## 推荐演进路径

### Phase 1 · CLI（最快落地）

新增 `scripts/thesis-cli.mjs`：

```bash
node scripts/thesis-cli.mjs clients list
node scripts/thesis-cli.mjs clients get cli_xxx
node scripts/thesis-cli.mjs orders create --client-id cli_xxx --json payload.json
```

- 直接 import repository + validation（与 API 同逻辑）
- 无需启动 Next.js
- Agent 在 terminal 调用即可

### Phase 2 · MCP Server（Cursor 原生集成）

新增 `mcp/thesis-platform/` MCP server，暴露 tools：

| Tool | 对应 |
|------|------|
| `list_clients` | GET /api/clients |
| `create_order_for_client` | POST /api/clients/[id]/create-order |
| `update_order` | PATCH /api/orders/[id] |
| … | … |

配置写入 `.cursor/mcp.json`（项目级）或用户全局 MCP 设置。

### Phase 3 · 安全与审计

- 本地 API token（`THESIS_API_TOKEN` env）
- 操作日志（`data/audit.log`）
- 可选：只读 mode vs 读写 mode

## 业务约束（Agent 必须遵守）

1. 工单**只能**通过 `create-order` 从客户创建
2. 删除前检查关联（Phase 1 实现 integrity 后生效）
3. 财务字段修改需保持 `receivableAmount = amount - settledAmount` 等口径一致

## 相关 Skill

详见 `.cursor/skills/thesis-agent-crud/SKILL.md`。
