## Why

当前应用已经形成了世界库、世界设定、内容种子、运行记录和事件日志等核心领域模型，但状态全部保存在浏览器 `localStorage` 中，无法跨设备恢复、无法多人协作，也无法为后续 Agent 世界运行提供可信事实源。现在先建立世界状态后端，可以在不急于接入 LangGraph 的情况下，把“世界事实从哪里读、写到哪里、如何回滚”这条主干立住。

## What Changes

- 新增世界状态后端能力，使用 FastAPI + PostgreSQL 提供世界、设定、内容种子、运行状态和事件日志的持久化 API。
- 新增数据库模型与迁移，用服务端 `worldId` 作为世界设定、内容种子、运行记录和事件的稳定关联键。
- 将创建世界、读取世界库、切换 active world、保存设定、保存内容种子、记录事件、暂停/继续运行和推进一日从纯本地状态升级为后端 API 操作。
- 保留首版非 Agent 边界：推进一日可以由后端生成结构化运行结果摘要，但不得触发 LangGraph、LLM 叙事生成或真实多 Agent 工作流。
- 提供浏览器本地旧数据的导入或迁移路径，避免已有原型数据在切换后端后直接丢失。
- 保留前端可用性回退：后端不可用时应清晰报错或进入只读/本地演示状态，而不是让页面渲染失败。

## Capabilities

### New Capabilities

- `world-state-backend`: 定义世界状态服务端持久化、数据库模型、API 边界、状态更新规则、旧本地数据迁移和非 Agent 运行边界。

### Modified Capabilities

- `world-library`: 从浏览器本地世界库改为远程世界库为主，并保留旧本地世界库迁移能力。
- `world-creation-entry`: 创建世界从只写本地状态改为调用后端创建世界、初始化设定，并激活新世界。
- `world-settings-editor`: 世界设定保存与恢复从纯本地状态改为后端持久化，并保留本地旧设定导入。
- `world-seed-assets`: 角色、势力、地点和关系种子保存与恢复从纯本地状态改为按世界后端持久化。
- `world-event-ledger`: 世界运行状态、暂停状态、推进一日、事件和最近运行结果从本地运行记录改为后端持久化；推进一日仍不触发 Agent。
- `world-event-log-page`: 事件日志页面从本地运行记录读取改为读取后端事件列表，并通过后端创建事件。
- `ink-dashboard-ui`: 工作台数据源从本地状态组合改为远程世界状态快照，并让运行、设定、种子和事件入口对接后端状态。

## Impact

- 受影响代码：`src/lib/world-*.ts` 状态工具、`src/components/dashboard/ink-dashboard.tsx`、`src/components/world-creation/create-world-page.tsx`、`src/components/events/world-event-log.tsx`、相关页面入口和共享类型。
- 新增后端代码：FastAPI 应用、数据库模型、迁移、服务层、API 路由、测试配置和本地开发启动说明。
- 新增依赖与系统：PostgreSQL、Python 后端依赖、数据库迁移工具、后端测试命令；后续可扩展 pgvector 与 LangGraph，但本变更不接入 Agent。
- 现有功能影响：用户流程应保持一致，但原先刷新后读取 `localStorage` 的行为会变为读取后端；旧本地数据需要可导入，未导入前仍可展示默认/空状态。
- 回滚计划：保留当前本地状态工具和演示路径直到后端接入验证完成；如后端接入失败，可切回 localStorage 适配器并回滚新增 API 调用、后端目录和数据库迁移。
- 需要协调的团队：前端负责 API client 与 UI 状态迁移，后端负责 FastAPI、数据库和迁移，产品/叙事设计负责确认世界状态字段和推进一日的非 Agent 结果边界，运维/平台负责 PostgreSQL 与环境变量。
