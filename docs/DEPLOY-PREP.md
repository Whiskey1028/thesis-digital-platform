# 同机共部署准备清单（thesis × AITK）

面向阿里云轻量机 `2C / ~3.4Gi / Nginx:80`；**本文件只做检查与准备，不替代 Owner 授权后的实际上机操作。**

## 发布产物（本机执行）

```bash
# 建议在 linux/amd64 或 CI 上构建；本机若为 macOS，better-sqlite3 需交叉编译或在目标机装运行时依赖后重建
npm ci
npm run build

# standalone 输出：
#   .next/standalone/
#   .next/static/ → 拷到 standalone/.next/static/
#   public/       → 拷到 standalone/public/
```

运行时监听：`HOSTNAME=127.0.0.1 PORT=3020`（勿对公网开放原始端口）。

## 环境变量（服务器 `.env`，勿入库）

| 变量 | 说明 |
|------|------|
| `SITE_ACCESS_PASSWORD` | 站点门禁；不设则关闭 |
| `SITE_ACCESS_SECRET` | cookie 签名；建议与密码不同 |
| `NEXT_PUBLIC_BASE_PATH` | 必须为 `/thesis`（与 Nginx location 一致） |

## Nginx（在现有 aitk server 内追加，勿改 `/` 与 `/media/`）

```nginx
location /thesis/ {
    proxy_pass http://127.0.0.1:3020;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

入口：`http://<IP>/thesis` → 解锁页（若已设密码）→ 业务页。

## systemd 单元草案（命名 `thesis`，目录 `/opt/thesis`）

- `WorkingDirectory=/opt/thesis/current`
- `EnvironmentFile=/opt/thesis/shared/.env`
- `ExecStart=/usr/bin/node server.js`（standalone）
- 数据目录建议：`/opt/thesis/shared/data/thesis.db`（与 release symlink 分离）

## 上机前检查（Owner 授权后执行）

1. `free -h`：available 建议 ≥ 1Gi；禁止机上 `next build`
2. `ss -lptn | grep -E '3020|3010'`：3020 空闲；勿占用 3010
3. 磁盘：`df -h /` 余量充足
4. Node：与现有 AITK 同大版本（22.x）优先
5. 冒烟：本机 `curl -I http://127.0.0.1:3020/thesis` → 200/307；再 Nginx reload 后公网 `/thesis`
6. 回归 AITK：`/` 与 `/media/` 仍正常
7. 回滚：停 `thesis` + 注释 `/thesis/` location + `nginx -t && reload`

## 明确不做

- 不复用 AITK 的 Postgres / Redis / MinIO
- 不在服务器 `git pull` 后现场 build
- 不公网暴露 3020 / 数据面端口
