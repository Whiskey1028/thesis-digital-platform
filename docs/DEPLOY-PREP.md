# 同机部署文档索引（thesis × AITK）

面向阿里云轻量机共部署。**密钥与 `.env` 明文不入库。**

| 文档 | 内容 |
|------|------|
| [SERVER-INVENTORY.md](./SERVER-INVENTORY.md) | **远端服务器现状**：规格、端口、路径、Nginx/systemd、给新应用的避让表 |
| [DEPLOY-PLAYBOOK.md](./DEPLOY-PLAYBOOK.md) | **正确推送方案**：standalone 打包、scp、symlink、rebuild、冒烟、回滚、数据修复 |

## 快速对照

- SSH：`ssh -i ~/.ssh/aitk_deploy root@47.97.249.28`
- thesis 入口：`http://47.97.249.28/thesis`（`basePath=/thesis`，loopback `3020`）
- AITK 入口：`http://47.97.249.28/`（loopback `3010`）；`/media/` → MinIO
- 数据：`/opt/thesis/shared/data/thesis.db`
- 发版：**禁止机上 `next build`**；本机构建 + 机上 `npm rebuild better-sqlite3`

## 本地 env 模板

见仓库根目录 `.env.example`（仅键名与说明）。
