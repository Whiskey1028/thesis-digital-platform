# Thesis Digital Platform

论文数字化平台 MVP，当前聚焦三块：

- 论文客户管理
- 论文工单管理
- 论文写手管理

并包含一版轻量统计分析面板。

## Current Product Rules

- 客户信息先创建
- 工单不能单独创建
- 工单只能从客户页面一键生成
- 工单创建弹窗会自动带入客户档案中的重叠字段，并允许继续编辑
- 写手信息独立管理

## Local Development

1. `npm install`
2. `npm run dev`
3. 打开 `/overview`

## Troubleshooting

如果开发环境出现类似下面的报错：

- `Could not find the module ... in the React Client Manifest`
- `Cannot find module './611.js'`
- `__webpack_modules__[moduleId] is not a function`

通常说明 `.next` 开发缓存损坏或 dev 产物错位。可以这样处理：

1. 停掉当前 `next dev`
2. 删除或重命名 `.next`
3. 重新执行 `npm run dev`

本次排障时，旧缓存已被保留为一个备份目录：

- `.next-cache-broken-1778662450`

确认没用后可以手动删除。

## Storage Decision

- 当前：`No DB / JSON repository`
- 后续：可切换到 `SQLite`

## Historical Import

历史 Excel 数据已支持结构化导入：

- 脚本：`node scripts/import-history.mjs`
- 输出：
  - `data/imported-orders.json`
  - `data/imported-clients.json`

## Current Enhancements

- 工单支持 `自接 / 转包` 标识
- 工单页支持搜索、状态筛选、类型筛选
- 工单支持编辑与删除
- 客户与写手支持前端新增
- 总览支持收入、回款、应收、成本、利润等统计

详细说明见 [lightweight-architecture.md](/Users/whiskey/Projects/Github/Whiskey1028/thesis-digital-platform/docs/architecture/lightweight-architecture.md)。
