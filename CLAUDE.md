# parasite-tower 项目宪法

## 规则权威：JS 唯一

**Android WebView 内的 JS（`android/app/src/main/assets/`）是寄生塔所有游戏规则的唯一权威。**

包括但不限于：
- 战斗结算、伤害公式、暴击/闪避判定
- 附身成功率、附身收益
- 进化树、形态切换、楼层生成
- 楼层签名、Modifier、谈判、剧情触发

### Go 后端只允许两类职责
1. **存储与查询**：排行榜（`parasite-tower-leaderboard`）等数据服务
2. **提交时合理性校验**：用经验上界过滤显然伪造的数据（例如 `score ≤ floor*5000`），**不得在 Go 重新实现公式**

### 禁止
- 在任何 Go 包里维护战斗 / 附身 / 进化 / 楼层公式的"镜像版"
- 让客户端的某次行为依赖后端返回（除排行榜读写之外）
- 把 JS 现有规则迁移成"Go 算 → 客户端展示"的形式

### 历史遗留
- `internal/{combat,entity,game}` 与 `internal/api/webengine.go` 是另一条独立 Web 部署路径的 mirror（约 1500 行），目前**冻结**：不删除、不增删功能、不再同步 JS 改动。如未来确认无人使用，可整体删除。

### 反作弊策略
- MVP：依赖客户端版本号 + Go 端合理性上界 + 人工封号（`POST /admin/ban`）
- v2 可选：HMAC 签名（不计入"规则镜像"，只是传输完整性）
