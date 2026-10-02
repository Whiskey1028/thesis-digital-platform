# thesis 推送到远端服务器 · 正确方案（Playbook）

> 与 [SERVER-INVENTORY.md](./SERVER-INVENTORY.md) 配套。目标：更新 **thesis**，**零改动 AITK**（`/`、`/media/`、3010、PG/Redis/MinIO）。  
> **禁止**提交密钥、`.env` 明文。SSH：`ssh -i ~/.ssh/aitk_deploy root@47.97.249.28`。

## 原则

1. **本机（或 CI）** `npm run build` 出 Next `standalone`，不在服务器上 `next build`  
2. 打包 → `scp` → `/opt/thesis/release/<ver>/` → 切 `current` symlink → `systemctl restart thesis`  
3. macOS 构建后，在服务器对 `better-sqlite3` 执行 **`npm rebuild`**（换 linux-x64 原生库）  
4. 业务数据只在 `/opt/thesis/shared/data`；新 release 用 symlink 挂上，勿覆盖库文件  
5. Nginx 已配好 `/thesis` 时，发版 **不必** reload Nginx；仅改 location 时才 `nginx -t && systemctl reload nginx`

---

## A. 常规发版（代码 / 前端更新）

在仓库根目录（建议检出要上的分支，如 `dev` / `main`）：

```bash
# 0) 确认本地可构建
npm ci
npm run build

# 1) 组装 standalone 目录
REL="vX.Y.Z-$(date +%Y%m%d%H%M%S)"
rm -rf /tmp/thesis-release && mkdir -p /tmp/thesis-release
cp -R .next/standalone/. /tmp/thesis-release/
mkdir -p /tmp/thesis-release/.next
cp -R .next/static /tmp/thesis-release/.next/static
cp -R public /tmp/thesis-release/public
find /tmp/thesis-release -name '._*' -delete

# 2) 打包并上传
tar -C /tmp/thesis-release -czf "/tmp/${REL}.tar.gz" .
scp -i ~/.ssh/aitk_deploy "/tmp/${REL}.tar.gz" root@47.97.249.28:/tmp/
```

服务器上：

```bash
REL='vX.Y.Z-YYYYMMDDHHMMSS'   # 与本地一致
mkdir -p /opt/thesis/release/$REL
tar -xzf /tmp/$REL.tar.gz -C /opt/thesis/release/$REL
rm -f /tmp/$REL.tar.gz
find /opt/thesis/release/$REL -name '._*' -delete

# 数据目录挂到 shared（保留现网库）
rm -rf /opt/thesis/release/$REL/data
ln -sfn /opt/thesis/shared/data /opt/thesis/release/$REL/data

# 原生模块（mac 产物必须做）
cd /opt/thesis/release/$REL
npm rebuild better-sqlite3 --omit=dev

# 原子切流 + 重启（不碰 aitk）
ln -sfn /opt/thesis/release/$REL /opt/thesis/release/current.new
mv -Tf /opt/thesis/release/current.new /opt/thesis/release/current
systemctl restart thesis
systemctl is-active thesis
```

### 冒烟（服务器上）

```bash
IP=47.97.249.28
curl -sI -H "Host: $IP" http://127.0.0.1/ | head -5          # AITK 仍 200
curl -sI -H "Host: $IP" http://127.0.0.1/thesis/login | head -8
curl -sI -H "Host: $IP" http://127.0.0.1/thesis/overview | head -8
# 未解锁时应 Location: http://47.97.249.28/thesis/login?...  （勿再出现 127.0.0.1）
```

浏览器：`http://47.97.249.28/thesis` → 门禁密码（见服务器 `.env`，勿写入文档）。

### 回滚代码

```bash
ln -sfn /opt/thesis/release/<上一版目录> /opt/thesis/release/current
systemctl restart thesis
```

---

## B. 仅修 SQLite 数据（不停全站过久）

```bash
ssh -i ~/.ssh/aitk_deploy root@47.97.249.28
systemctl stop thesis
# 用 node + better-sqlite3 跑修复脚本，或手动 SQL
# DB: /opt/thesis/shared/data/thesis.db
# 例：仓库 scripts/repair-2025-settled-amount.ts 逻辑
systemctl start thesis
```

有 WAL 时尽量停服务再写；写完可 `PRAGMA wal_checkpoint(TRUNCATE)`。

---

## C. 首次上机 / 改 Nginx（对照用；现网已做过）

仅当 **没有** `/thesis` location 或端口未监听时：

1. 建 `/opt/thesis/{release,shared}`，写入 `shared/.env`（键见 inventory）  
2. 装好首包并 `systemctl enable --now thesis`  
3. 在 **现有** `sites-available/aitk` 中 **追加** `upstream thesis_next` + `location /thesis {…}`，**不要改** `/` 与 `/media/`  
4. `nginx -t && systemctl reload nginx`  
5. 按 A 冒烟 + 确认 AITK `/` 正常  

备份示例：现网曾有 `aitk.bak.20261002003541`。

---

## D. 错误做法（否决）

| 做法 | 原因 |
|------|------|
| 服务器 `git pull && npm run build` | 无 Swap，易 OOM，拖垮 AITK |
| 公网暴露 3020 / 5432 / 6379 / 9000 | 违反防火墙约定 |
| 改 AITK 的 `/` 或 `/media/` 给新应用 | 破坏已验收站 |
| 共用 AITK Postgres 同库同 schema | 隔离与故障耦合 |
| macOS 的 `better-sqlite3` 不 rebuild 就上 linux | 进程起不来或静默炸 |

---

## E. 给其他应用推送时的最小对照

1. 读 [SERVER-INVENTORY.md](./SERVER-INVENTORY.md) 端口/路径表  
2. 复制本 Playbook 结构：`/opt/<app>/{release,shared}` + systemd + Nginx **新** location  
3. loopback 端口避开 `3010` / `3020`  
4. 发版流程与本节 **A** 相同（artifact → scp → symlink → restart）  
5. 每次发版后 curl 回归：`/`、`/media/`、`/thesis`、以及你的新路径  

本仓应用公网入口：**`http://47.97.249.28/thesis`**。
