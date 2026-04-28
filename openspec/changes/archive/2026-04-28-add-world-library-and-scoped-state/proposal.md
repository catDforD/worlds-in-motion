## Why

当前世界设定、内容种子和运行记录都近似浏览器本地全局单例；继续推进多世界、后端持久化、Agent 运行日志和角色行动之前，需要先建立稳定的 `worldId` 边界。这个 change 先在前端本地层引入世界库和当前世界 ID，让每类状态都能明确归属到某个世界。

## What Changes

- 新增本地世界库，支持保存多个世界记录、创建世界、切换当前世界，并维护 active world ID。
- 创建世界从“覆盖当前世界状态”改为“创建一条世界记录并设为 active”，随后进入工作台查看该世界。
- 世界设定、世界内容种子和世界运行记录均按 `worldId` 读取、保存、订阅和回退，避免不同世界互相覆盖。
- 增加旧 localStorage 单世界数据迁移：首次读取世界库时将旧的世界设定、内容种子、运行记录和创建临时状态归并到一个默认世界。
- 更新 README 和现有 specs 中残留的 Purpose TBD，确保文档描述当前能力边界。
- 本阶段仍保持纯前端本地状态，不引入后端世界 API、数据库写入或 Agent 运行。

## Capabilities

### New Capabilities
- `world-library`: 定义本地世界库、世界记录、active world ID、创建多个世界和切换当前世界的能力。

### Modified Capabilities
- `world-creation-entry`: 创建流程从覆盖当前世界状态调整为创建世界库记录并激活该世界。
- `world-settings-editor`: 世界设定读写从全局单例调整为按 active `worldId` 隔离。
- `world-seed-assets`: 内容种子读写从全局单例调整为按 active `worldId` 隔离。
- `world-event-ledger`: 世界运行记录读写从全局单例调整为按 active `worldId` 隔离。

## Impact

- 影响前端本地状态模块：`src/lib/world-settings.ts`、`src/lib/world-seed-assets.ts`、`src/lib/world-runtime.ts`，以及新增或扩展世界库模块。
- 影响创建页和工作台：`src/components/world-creation/create-world-page.tsx`、`src/components/dashboard/ink-dashboard.tsx` 需要通过 active world 获取对应状态。
- 影响类型定义：需要为世界记录、世界库 payload、`worldId` 作用域状态和迁移结果补充 TypeScript 类型。
- 影响测试与验证：需要覆盖多世界创建、切换、隔离保存、旧数据迁移和损坏数据回退。
- 对现有功能的影响：单世界用户首次升级后应自动看到原有世界内容；后续创建新世界不应覆盖旧世界。
- 需要协调的团队：前端团队负责本地状态和 UI，产品/叙事设计确认世界库首版字段，后端/Agent 团队确认 `worldId` 命名和未来接口边界。
- 回滚计划：删除世界库入口和 scoped storage 读写路径，恢复旧版单例 storage key 的读取逻辑；浏览器中新增的世界库数据可保留但停止读取，不影响页面加载。
