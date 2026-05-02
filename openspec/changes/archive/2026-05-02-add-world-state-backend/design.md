## Context

织世录当前是 Next.js 前端原型，世界库、世界设定、内容种子、世界运行记录、事件日志和最近运行结果都通过 `src/lib/world-*.ts` 写入浏览器 `localStorage`。这些模块已经形成稳定的领域边界，但缺少服务端事实源，导致状态不能跨设备恢复，也无法作为后续 LangGraph/多 Agent 世界运行的输入输出基础。

本变更将引入 Python FastAPI + PostgreSQL 后端。前端仍保留现有页面和交互，后端先承担状态持久化、校验、迁移和轻量推进一日摘要，不接入 LLM、LangGraph 或真实 Agent 工作流。

受影响模块包括：

- 前端状态层：`src/lib/world-library.ts`、`src/lib/world-settings.ts`、`src/lib/world-seed-assets.ts`、`src/lib/world-runtime.ts`
- 前端页面与组件：`src/components/dashboard/ink-dashboard.tsx`、`src/components/world-creation/create-world-page.tsx`、`src/components/events/world-event-log.tsx`
- 后端新增模块：FastAPI 应用、数据库模型、迁移、服务层、API 路由、测试和本地开发配置
- 规格与文档：OpenSpec 现有 localStorage-only 能力、README 开发说明

## Goals / Non-Goals

**Goals:**

- 建立服务端世界状态事实源，覆盖世界库、active world、世界设定、内容种子、运行状态、事件和最近运行结果。
- 提供 REST API，使现有前端流程从本地读写迁移到远程读写。
- 保持现有 TypeScript 领域类型的响应形状尽量稳定，减少 UI 层重写。
- 提供旧 `localStorage` 数据导入路径，避免前端原型已有数据直接丢失。
- 明确首版非 Agent 边界：后端可以生成规则化运行摘要，但不得触发 LangGraph、LLM 或角色行动工作流。
- 增加后端单元/集成测试和前端类型检查，确保迁移后关键流程可验证。

**Non-Goals:**

- 不实现用户账号、权限、多租户或团队协作。
- 不接入 pgvector、语义检索、LangGraph、LLM prompt 或 Agent 编排。
- 不实现真实章节生成、小说正文生成或故事发布工作流。
- 不要求一次性删除本地状态工具；它们可以作为迁移、演示或后端不可用时的回退适配器保留。

## Decisions

### 1. 使用 FastAPI + PostgreSQL 作为后端主栈

选择 FastAPI 是因为项目目标后续包含 LangGraph、Python Agent、向量检索和异步任务，Python 后端能减少后续跨语言编排成本。选择 PostgreSQL 是因为世界状态既包含结构化实体，也会逐步包含事件、章节、检索和向量扩展，PostgreSQL 能同时承载关系数据与后续 pgvector。

替代方案：Next.js Route Handlers + Prisma/Drizzle 可以更快接入当前前端，但会让未来 Agent 编排跨到 Node/Python 两侧；纯 SQLite 更轻，但不适合后续多进程任务、部署和向量检索。

### 2. API 路由保持薄层，复杂状态更新进入服务层

FastAPI 路由只负责请求/响应、依赖注入和状态码映射；创建世界、导入本地数据、推进一日、追加事件等复杂逻辑放入服务层。这样避免 API 路由直接修改复杂世界状态，也为后续任务队列或 Agent runner 复用同一套服务逻辑留下边界。

替代方案：在路由内直接写业务逻辑实现更快，但后续会难以测试、复用和回滚。

### 3. 数据模型采用“核心实体规范化 + 摘要 JSONB”

首版建议表结构：

- `workspaces`: 单用户首版的默认工作区，保存 active world ID；未来可映射到 user/team。
- `worlds`: 世界记录，保存名称、类型、描述、标签、创建/更新时间。
- `world_settings`: 一对一保存背景、规则、风格、禁止事项和核心矛盾。
- `seed_characters`、`seed_factions`、`seed_locations`、`seed_relationships`: 规范化保存内容种子，便于计数、筛选和未来 Agent 查询。
- `world_runtime_states`: 一对一保存当前世界时间、运行天数、暂停状态、章节草稿、最新章节和最近运行结果引用。
- `world_events`: 保存结构化事件事实字段。
- `world_run_results`: 保存推进一日后的统计、分类明细和生成时间，明细可使用 JSONB。

替代方案：把整个 `WorldRuntimeState` 和 `WorldSeedAssets` 原样存成 JSONB 会最快，但会让事件查询、种子计数、局部更新、未来 Agent 检索变弱。完全规范化所有章节草稿明细则会提前引入暂不需要的复杂度。

### 4. 前端新增 API client / repository 适配层

现有 UI 不直接 `fetch` 后端，而是通过 `src/lib` 下的 API client 或 repository 函数读取世界状态。这样可以让 UI 继续使用接近现有类型的对象，并把错误处理、旧数据导入、缓存刷新和本地回退集中处理。

替代方案：在组件里直接调用 API 能少写一层，但会把网络状态、错误、迁移和领域转换散落到 UI，后续更难接 Agent 状态。

### 5. 首版 active world 仍是“默认工作区”级别

在没有用户账号的情况下，后端使用一个默认 workspace 保存 active world ID。API 对外仍暴露“读取世界库 + activeWorldId”“设置 active world”的能力。未来引入认证时，可以把 workspace 归属迁移到 user/team，而不用改前端世界资源路径。

替代方案：继续把 active world 保存在浏览器本地会少做一张表，但同一后端状态在不同浏览器会看到不同 active world，不利于把后端作为事实源。

### 6. 旧本地数据通过显式导入接口迁移

前端检测到旧 `localStorage` 数据时，调用导入接口上传世界库、设定、种子和运行记录快照；后端校验后创建或合并世界，并返回客户端旧 ID 到服务端 ID 的映射。导入必须幂等，重复导入同一旧世界不应产生不可控重复。

替代方案：后端无法直接读取浏览器 `localStorage`；让用户手动复制 JSON 不符合产品体验。自动静默导入风险是用户无法理解数据变化，因此首版应在 UI 上显示迁移/导入状态。

### 7. 推进一日只做规则化摘要，不触发 Agent

`POST /worlds/{worldId}/runtime/run-day` 在服务层推进时间、运行天数，并生成非 LLM 的结构化 `runResult`。它可以参考当前事件、角色、关系和秘密数量生成摘要，但不得创建 Agent 任务、调用 LangGraph、调用 LLM 或自动追加事件。

替代方案：直接接 LangGraph 会更接近最终愿景，但当前缺少稳定事实源、任务日志、失败恢复和成本控制。

## Risks / Trade-offs

- [Risk] 没有账号体系时，默认 workspace 会让部署环境呈现单用户状态。→ Mitigation: 数据模型预留 `workspace_id`，API 路径和服务层避免写死用户概念，后续可迁移到认证用户。
- [Risk] 前端从同步 localStorage 迁移到异步 API 后，页面会出现加载和失败状态。→ Mitigation: 在 repository 层统一提供 loading/error/empty 语义，并让工作台和事件页使用可读空状态。
- [Risk] 旧本地数据导入可能重复创建世界或丢字段。→ Mitigation: 导入接口返回 ID 映射，按旧 `worldId` 和字段校验幂等，保留原始快照直到导入成功。
- [Risk] 规范化表结构增加首版实现量。→ Mitigation: 只规范化需要查询/计数/更新的实体，章节草稿和运行明细暂用 JSONB。
- [Risk] 后端运行一天摘要容易被误解为真实 Agent。→ Mitigation: API、UI 和 spec 明确“规则化摘要、不得触发 Agent”，后续 Agent change 单独提出。
- [Risk] 远程 API 增加延迟。→ Mitigation: 列表接口返回工作台所需快照，避免工作台首屏串行请求过多资源；事件列表后续可分页。
- [Risk] 数据库写入失败会影响创建和保存流程。→ Mitigation: 服务层事务包裹跨表写入，前端展示保存失败并保持用户输入不丢失。

## Migration Plan

1. 新增后端工程、数据库连接、迁移和健康检查，不接前端。
2. 创建数据库表和 Pydantic schema，补齐世界、设定、种子、运行状态、事件和运行结果服务。
3. 实现 REST API 与后端测试，使用默认 workspace 支持 active world。
4. 前端新增 API client/repository，并先在创建世界、世界库读取和 active world 切换中接入。
5. 逐步迁移设定、种子、运行状态、事件日志和推进一日操作。
6. 增加旧 localStorage 导入流程，导入成功后保留本地快照但优先读后端。
7. 更新 README 和开发命令，运行后端测试、前端 lint/typecheck 和关键页面浏览器验收。

Rollback 策略：

- 后端未接入前端时，可删除新增后端目录、迁移和配置。
- 前端接入后，如果后端不稳定，切换 repository 到 localStorage 适配器，保留现有本地状态工具作为回退。
- 数据库迁移使用向前兼容方式；需要回滚时停止前端 API 调用，再回滚表结构或保留无用表，不影响前端本地演示路径。

## Open Questions

- 首版是否需要显式“导入本地数据”按钮，还是检测到旧数据后自动弹出迁移提示？
- 默认 workspace 的 ID 和初始化时机放在后端启动、数据库 seed，还是首次 API 请求时创建？
- 事件列表首版是否需要分页，还是先返回完整列表并在前端滚动区域内展示？
- 开发环境是否使用 Docker Compose 管理 PostgreSQL，还是先依赖本机数据库连接字符串？
