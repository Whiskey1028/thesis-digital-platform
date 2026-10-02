# 远端服务器现状快照（同机共部署对照）

> 快照日期：2026-10-02（探针）。**禁止**把真实密码、`.env` 明文、SSH 私钥写入本文件或提交到 git。  
> 用途：本仓部署对照；其他应用要上同一台机时，先读本文件再占路径/端口。

## 1. 实例

| 项 | 值 |
|----|-----|
| 云厂商 | 阿里云轻量 |
| 公网 IP | `47.97.249.28`（内测，暂无域名/HTTPS） |
| 规格 | 2C / ~3.4Gi RAM / ~49G 根盘 |
| OS | Ubuntu 24.04.5 LTS · x86_64 |
| Swap | **无** |
| SSH | `root@47.97.249.28`，本机密钥 `~/.ssh/aitk_deploy`（私钥勿入库） |
| 防火墙公网 | 仅 **22 / 80 / 443**（及 ICMP）；数据面不对公网 |

## 2. 运行时与进程

| 组件 | 说明 |
|------|------|
| Node | `/usr/local/bin/node` **v22.23.3** |
| Nginx | 1.24.0（Ubuntu apt）；站点 `sites-enabled/aitk` → `sites-available/aitk` |
| Postgres | apt **16**，`127.0.0.1:5432`（**AITK 专用**，他应用勿共用业务库） |
| Redis | apt，`127.0.0.1:6379`（AITK） |
| MinIO | Docker，`127.0.0.1:9000` / `9001`；桶前缀经 Nginx `/media/` |
| Docker | 仅 MinIO 等必要容器；**勿默认 Docker Hub library/postgres** |

## 3. 端口与路径占用（硬约束）

| 入口 | 后端 | 归属 | 备注 |
|------|------|------|------|
| 公网 `:80` `/` | `127.0.0.1:3010` | **AITK** | `default_server`；勿抢 |
| 公网 `:80` `/media/` | `127.0.0.1:9000/aitk-media/` | **AITK** | 勿改语义 |
| 公网 `:80` `/thesis` | `127.0.0.1:3020` | **thesis** | `basePath=/thesis` |
| loopback `3010` | Next standalone | AITK systemd `aitk` | |
| loopback `3020` | Next standalone | thesis systemd `thesis` | |
| `5432` / `6379` / `9000` / `9001` | 数据面 | AITK | **禁止对公网开放** |

新应用若再上同机：另选 loopback 端口（如 `3030`）、Nginx **新 location 或独立 server_name**，**不得**覆盖上表 AITK/thesis 语义。

## 4. 目录布局

```text
/opt/aitk/
  release/current → 某次 aitk-YYYYMMDD-… 目录
  （历史 release 包与目录较多；发版方式：本机 standalone → scp → 切 symlink → restart）

/opt/thesis/
  release/
    current → /opt/thesis/release/<version-timestamp>
    v2.0.x-…/
  shared/
    .env                 # 仅权限 root；变量名见下，无明文入库
    data/                # SQLite + JSON 种子
      thesis.db
      *.json

/etc/nginx/sites-available/aitk
/etc/systemd/system/aitk.service
/etc/systemd/system/thesis.service
```

## 5. systemd（摘要）

**aitk**

- `WorkingDirectory=/opt/aitk/release/current`
- `EnvironmentFile=/opt/aitk/release/current/.env`
- `PORT=3010` `HOSTNAME=127.0.0.1`
- `ExecStart=/usr/local/bin/node server.js`

**thesis**

- `WorkingDirectory=/opt/thesis/release/current`
- `EnvironmentFile=/opt/thesis/shared/.env`
- `PORT=3020` `HOSTNAME=127.0.0.1`
- `ExecStart=/usr/local/bin/node server.js`
- `data` → symlink 到 `/opt/thesis/shared/data`（与 release 分离）

## 6. Nginx 现网结构（已落地）

```nginx
upstream aitk_next   { server 127.0.0.1:3010; keepalive 8; }
upstream thesis_next { server 127.0.0.1:3020; keepalive 8; }

server {
  listen 80 default_server;
  listen [::]:80 default_server;
  server_name _;
  client_max_body_size 8m;

  location /media/ { proxy_pass http://127.0.0.1:9000/aitk-media/; /* … */ }

  location /thesis {
    proxy_pass http://thesis_next;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    /* Upgrade / Connection 按需 */
  }

  location / {
    proxy_pass http://aitk_next;
    /* 同上转发头 */
  }
}
```

说明：`location /thesis` **无尾斜杠** + `proxy_pass` 不带 URI，会把完整 `/thesis…` 传给应用（匹配 Next `basePath`）。

## 7. thesis 环境变量（仅键名）

文件：`/opt/thesis/shared/.env`

| 键 | 用途 |
|----|------|
| `SITE_ACCESS_PASSWORD` | 站点门禁；空则关闭 |
| `SITE_ACCESS_SECRET` | cookie HMAC |
| `NEXT_PUBLIC_BASE_PATH` | 必须 `/thesis` |
| `NODE_ENV` | `production` |

本地对照可用仓库 `.env.example` / 本机 `.env.local`（后者 gitignore）。

## 8. 资源余量（快照时）

- available RAM ≈ **2.4Gi**；双 Next 稳态可共存
- 盘可用 ≈ **39G**
- **禁止**在无 Swap 的 2C4G 上现场 `next build`（易 OOM 拖垮 AITK）

## 9. 给「下一个应用」的检查清单

1. 端口：确认 `ss -lptn` 目标 loopback 空闲  
2. 路径：不占用 `/`、`/media/`、`/thesis`  
3. 数据：独立目录 `/opt/<app>/shared`；勿接 AITK PG/Redis/MinIO 业务凭证  
4. 发版：本机/CI 打 linux 产物 → scp → symlink → `systemctl restart`；原生模块在机上 `npm rebuild`  
5. Nginx：只 **追加** location / server；`nginx -t` 后再 reload  
6. 回归：`curl -I http://127.0.0.1/` 与 `/media/`、`/thesis`  

正确推送步骤见同目录 [DEPLOY-PLAYBOOK.md](./DEPLOY-PLAYBOOK.md)。
