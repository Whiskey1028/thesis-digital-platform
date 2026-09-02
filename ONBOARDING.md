# 协作者上手说明（给人看 / 也可丢给 Cursor）

你不需要懂整套系统。只要有 **Cursor**，把下面这句话发给你的 Agent 即可：

> 请严格按仓库根目录 `ONBOARDING.md` 的「Agent 执行清单」帮我：拉取/检出正确分支、安装依赖、启动服务、验证页面，并教会我如何用自然语言让你录入客户与工单。每完成一步打勾并告诉我结果。

---

# Agent 执行清单

面向 Cursor Agent。按顺序执行，**不要跳步**。用户可能不懂终端；你来跑命令、解释结果，只用中文简短汇报。

## 0. 目标验收标准

全部完成后，用户应能：

1. 在浏览器打开本机页面（总览/客户/工单/写手）
2. 知道数据在 `data/thesis.db`（SQLite），不是手改 JSON
3. 能对 Agent 说「今天接了个单…」并完成建客户 + 建工单
4. 知道业务铁律：**先客户，再工单**

## 1. 环境检查

在项目根目录执行并确认：

| 项 | 要求 | 命令 |
|----|------|------|
| Node.js | **20+**（推荐 20/22/24） | `node -v` |
| npm | 随 Node 安装 | `npm -v` |
| Git | 能 clone / pull | `git --version` |

若 Node 过旧：指导用户安装 [https://nodejs.org](https://nodejs.org) LTS，装好后重开 Cursor 终端再继续。

可选：历史 Excel 导入需要本机 `python`/`python3`；**日常录入不需要**。

## 2. 获取代码

若用户尚未打开本仓库：

```bash
git clone https://github.com/Whiskey1028/thesis-digital-platform.git
cd thesis-digital-platform
```

**必须使用 `dev` 分支**（功能与 SQLite / Agent CRUD 在此；`main` 可能落后）：

```bash
git fetch origin
git checkout dev
git pull origin dev
```

用 Cursor **Open Folder** 打开该目录。确认工作区根目录就是本仓库（能看到 `package.json`、`AGENTS.md`）。

## 3. 安装依赖

```bash
npm install
```

失败时：删 `node_modules` 后重试；仍失败则贴完整报错给用户，检查网络/权限/`better-sqlite3` 原生编译（需 Xcode CLT / 构建工具）。

## 4. 启动 Web 服务

```bash
npm run dev
```

- 默认 [http://localhost:3000](http://localhost:3000)
- 若提示 **Port 3000 is in use**，看终端里的实际端口（常见 `3001`/`3003`），用那个地址打开
- 首次启动会自动创建 `data/thesis.db`（空库时从 `data/*.json` 种子导入）

验证：打开 `/overview`、`/clients`、`/orders`、`/writers`，侧栏应显示「本地 SQLite」。

停服务：在跑 `npm run dev` 的终端按 `Ctrl+C`。

缓存异常：停服务 → 删 `.next` → 再 `npm run dev`。

## 5. 配置 Cursor Agent（本仓库已带）

仓库内已有，一般**不用手改**：

| 文件 | 作用 |
|------|------|
| `AGENTS.md` | Agent 协作铁律 |
| `.cursor/rules/project-context.mdc` | 项目地图 |
| `.cursor/skills/thesis-platform-dev/` | 开发与业务规范 |
| `.cursor/skills/thesis-agent-crud/` | 用 CLI/MCP/API 改数据 |
| `.cursor/skills/thesis-onboarding/` | 本上手流程 |
| `.cursor/mcp.json` | 注册 `thesis-platform` MCP |

建议操作：

1. 重启一次 Cursor（或 Reload Window），让 Skills / MCP 加载
2. Settings → MCP：确认能看到 `thesis-platform`（首次可能要允许运行）
3. 日常改数据优先：`npm run cli -- …`（**不必**先开网页）；MCP 可用则亦可

**禁止**：直接改 `data/*.json` 或裸改 SQLite 当主写入路径。

## 6. 教用户「口述录入」标准说法

告诉用户可以直接对 Agent 说，例如：

> 今天接了个单：客户小王，微信 wx_wang，本科，某大学计算机，题目《……》，自接，服务类型论文全文，报价 3800，已付 1000，截止 2026-10-01，负责人自营。

Agent 必须遵守（详见 `.cursor/skills/thesis-agent-crud/SKILL.md`）：

1. `clients list --q …` 查重 → 没有则 `clients create`
2. `orders create --client-id <id> --json …`（**唯一合法建单**）
3. 回读确认，把客户 id / 工单 id 告诉用户
4. 缺字段用合理默认，并在回复中列出假设

CLI 自检（Agent 执行并展示输出）：

```bash
npm run cli -- clients list --page 1 --page-size 5
npm run cli -- orders list --page 1 --page-size 5
npm run cli -- writers list --page 1 --page-size 5
```

## 7. 业务铁律（必须口头告知用户）

1. **先建客户，再开工单**
2. 工单只能从客户上下文创建（Web「一键生成工单」或 CLI/MCP 的 create-for-client）
3. 写手在写手页/CLI 独立维护，派单时挂到工单上
4. 主存储：`data/thesis.db`

## 8. 可选：历史 Excel 导入

仅当用户有台账文件且需要批量导入时：

```bash
npm run import:history -- /绝对路径/台账.xlsx
```

会写入 SQLite，并刷新 JSON 种子。不确定时先问用户，不要擅自覆盖本地已有业务数据。

## 9. 完成汇报模板

Agent 全部完成后，用此格式回复用户：

```text
✅ 分支：dev（已 pull）
✅ npm install
✅ 服务地址：http://localhost:xxxx
✅ CLI 可列出客户/工单
✅ 你可以这样对我说话：「今天接了个单：…」
⚠️ 注意：先客户后工单；数据在 data/thesis.db
```

## 10. 常见问题

| 现象 | 处理 |
|------|------|
| 打开 3000 是别的网站 | 端口被占用；看 `npm run dev` 实际端口 |
| 页面空白/模块找不到 | 删 `.next` 后重启 |
| CLI 报 server-only | 必须用 `npm run cli -- …`（已带 stub），不要直接 `tsx` 错入口 |
| MCP 看不到 | 重启 Cursor；确认在本仓库打开；允许运行 `npm run mcp:thesis` |
| 想同步别人最新代码 | `git checkout dev && git pull origin dev`，有冲突先停手问用户 |

---

## 人类极简路径（不交给 Agent 时）

1. 安装 Node 20+
2. `git clone` → `git checkout dev` → `git pull`
3. Cursor 打开文件夹
4. 对 Agent 说本文开头那句提示词
