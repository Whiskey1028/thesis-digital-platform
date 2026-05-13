# Thesis Digital Platform

论文数字化平台 MVP：**以客户为入口**，串联论文客户档案、论文工单与写手池，并提供总览统计分析。

## 功能概览

| 模块 | 路径 | 说明 |
|------|------|------|
| 总览 | `/overview` | 收入、回款、应收、成本、利润等聚合指标；支持筛选 |
| 论文客户 | `/clients` | 客户档案 CRUD；**仅从此处**可一键生成工单 |
| 论文工单 | `/orders` | 列表、搜索、状态/类型筛选；工单编辑与删除；支持「自接 / 转包」来源标识 |
| 论文写手 | `/writers` | 写手信息独立维护与新增 |

根路径 `/` 会重定向到 `/overview`。

## 技术栈

- [Next.js](https://nextjs.org/) 15（App Router）
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod](https://zod.dev/)（校验）

## 核心业务规则

1. **先建客户**：客户信息需先创建。
2. **工单不单独建**：不提供「脱离客户」的工单创建入口；`POST /api/orders` 会返回 `405` 并提示须从客户上下文创建。
3. **从客户生成工单**：在客户页一键生成；创建弹窗会预填与客户档案重叠的字段，可在提交前继续编辑。
4. **写手独立管理**：写手池与客户、工单数据模型解耦。

工单来源类型（`sourceType`）：`self_owned`（自接）、`outsourced`（转包）。

## 本地开发

**环境**：建议使用 **Node.js 20 LTS** 或更高版本（与 Next.js 15 兼容）。

```bash
npm install
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)（默认进入总览）。

生产构建：

```bash
npm run build
npm run start
```

## 数据与存储

- **当前策略**：无独立数据库，使用项目根目录下 `data/` 中的 JSON 文件持久化；若文件不存在，首次读写会以内置 mock 数据初始化。
- **数据文件**：`data/clients.json`、`data/orders.json`、`data/writers.json`。
- **后续方向**：仓储层已抽象（`src/lib/repositories`），可平滑迁移到 SQLite 等方案。

> 说明：本仓库 `.gitignore` 默认忽略 `data/`，本地运行产生的业务数据不会进入版本库。

## HTTP API（摘要）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` / `POST` | `/api/clients` | 列表 / 新建客户 |
| `GET` / `PATCH` / `DELETE` | `/api/clients/[id]` | 单条客户 |
| `POST` | `/api/clients/[id]/create-order` | 从指定客户创建工单 |
| `GET` | `/api/orders` | 工单列表 |
| `POST` | `/api/orders` | 禁止直接创建（返回 405） |
| `GET` / `PATCH` / `DELETE` | `/api/orders/[id]` | 单条工单 |
| `GET` / `POST` | `/api/writers` | 列表 / 新建写手 |
| `GET` / `PATCH` / `DELETE` | `/api/writers/[id]` | 单条写手 |

## 历史 Excel 导入

将历史表格转为结构化 JSON（输出到 `data/`）：

```bash
node scripts/import-history.mjs
```

预期生成（与脚本配置一致）：`data/imported-orders.json`、`data/imported-clients.json`。另有 `scripts/repair-history-data.mjs` 可用于导入后的数据修复流程（按脚本内说明使用）。

## 项目结构（节选）

```
src/
  app/
    (dashboard)/          # 总览与客户/工单/写手页面
    api/                  # Route Handlers
  components/             # 页面与 UI 组件
  lib/
    repositories/         # 仓储实现与接口
    server/               # 文件读写等服务端工具
    types.ts              # 领域类型
```

## 故障排除（开发环境）

若出现类似以下错误，多为 `.next` 缓存损坏或 dev 产物不一致：

- `Could not find the module ... in the React Client Manifest`
- `Cannot find module './611.js'`
- `__webpack_modules__[moduleId] is not a function`

处理步骤：

1. 停止 `next dev`
2. 删除本地 `.next` 目录
3. 重新执行 `npm run dev`

---

架构与设计背景（若你本地有文档目录）：可参考 `docs/architecture/lightweight-architecture.md`（该路径在部分环境中被 `.gitignore` 忽略，克隆后不一定存在；上文已概括要点）。
