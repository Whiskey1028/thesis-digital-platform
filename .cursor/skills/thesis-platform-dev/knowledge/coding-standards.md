# KB-004 · 编码标准（2026）

`last_verified`: 2026-09-02

## 参考来源

| 标准 | 来源 | 适用点 |
|------|------|--------|
| App Router 分层 | [Next.js 15 Architecture Guide](https://amitdevx.tech/blogs/nextjs-15-app-router-architecture-guide) | Route groups、RSC 默认、Promise.all 并行取数 |
| API 四层模式 | [Velox 4-Layer API Pattern](https://velox.studio/blog/nextjs-api-structure) | Route → Service → Repository → Validator |
| Route Handler 规范 | [Pristren API Best Practices](https://pristren.com/blog/nextjs-api-routes-best-practices/) | Zod safeParse、统一错误响应、薄 Handler |
| TypeScript Lint | [typescript-eslint Typed Linting](https://typescript-eslint.io/getting-started/typed-linting) | strictTypeChecked + projectService |
| Clean Architecture | [nextjs-clean-architecture-template](https://github.com/jonathansantos-dev/nextjs-clean-architecture-template) | Repository 接口与实现分离、DI 接线点 |

## 本仓库落地结构

```
src/
├── app/api/**/route.ts     # HTTP 层：解析请求、调用 service、返回响应
├── lib/api/
│   ├── errors.ts           # ApiError 结构化错误
│   ├── responses.ts        # jsonData / runRoute 统一包装
│   ├── parse-request.ts    # JSON + Zod 边界校验
│   ├── ids.ts              # 实体 ID 生成
│   └── services/           # 业务逻辑（完整性、建单规则）
├── lib/queries/            # RSC 读模型（如 listWritersWithLoad）
├── lib/repositories/       # 数据访问接口 + JSON 实现
├── lib/validation.ts       # Zod schema（单一校验真源）
└── lib/domain/             # 纯函数领域规则（无 I/O）
```

## 强制约定

1. **Route Handler 不写业务逻辑** — 只做 parse → service → respond。
2. **Zod 是输入真源** — API 入参必须经 `parseJsonBody` + schema。
3. **`import "server-only"`** — storage、services、queries 禁止被 client 引用。
4. **Next.js 15 params 是 Promise** — 必须 `await context.params`。
5. **并行独立 fetch** — 页面用 `Promise.all`，避免 waterfall。
6. **错误格式** — `{ error: { code, message, details? } }`。
7. **根因修复** — 见根目录 `AGENTS.md`。

## 工具链

```bash
npm run lint          # ESLint strictTypeChecked
npm run format:check  # Prettier
npm run build         # 类型检查 + 生产构建
```
