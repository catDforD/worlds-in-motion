## Context

工作台已经有前端本地运行记录：`WorldRuntimeState` 记录当前世界时间、运行天数、暂停状态、事件列表和章节信息，`InkDashboard` 通过 `useSyncExternalStore` 读取 localStorage 并驱动运行状态、当前时间、近期事件和最新章节展示。当前“推进一日”只修改日期和运行天数，用户缺少“这一轮到底发生了什么”的即时反馈。

本次改动跨越本地运行记录类型、运行推进 helper 和工作台 UI，但仍是纯前端能力。首版不接 FastAPI、数据库、LangGraph 或真实角色行动流程。

受影响的文件和模块：

- `src/types/world-runtime.ts`：新增最近一次运行结果摘要类型，并挂载到 `WorldRuntimeState`。
- `src/lib/world-runtime.ts`：解析、默认值、兼容旧数据、运行一天 helper 和持久化逻辑。
- `src/components/dashboard/ink-dashboard.tsx`：运行按钮文案、运行处理函数、右侧信息栏结果面板。
- `src/types/dashboard.ts`、`src/lib/dashboard-data.ts`：如需要，补充面板展示用派生类型或默认文案。
- `src/app/globals.css`：补充结果面板在桌面和窄屏下的样式。

## Goals / Non-Goals

**Goals:**

- 用户每次点击“运行一天”后，立即看到本轮变化结果面板。
- 结果面板展示事件、关系变化、发现秘密、角色目标改变和故事草稿五类统计，并支持简短明细。
- 最近一次运行结果按 active world 保存在本地运行记录中，刷新页面和切换世界后可恢复。
- 旧本地运行记录和损坏数据安全回退，不影响现有工作台渲染。
- 保持当前首版边界：不调用后端、不触发 Agent、不把本轮摘要自动写入完整事件日志。

**Non-Goals:**

- 不实现真实多智能体世界运行、LLM 故事生成或角色决策。
- 不新增后端 API、数据库表、远程持久化或队列任务。
- 不把结果面板替代完整事件日志页面。
- 不重构工作台整体布局或导航体系。

## Decisions

1. 在 `WorldRuntimeState` 中新增 `lastRunResult`

   最近一次运行结果需要随 active world 持久化，因此放入本地运行记录，而不是只保存在 React 组件状态中。建议类型命名为 `WorldRuntimeRunResult`，包含 `id`、`date`、`runDay`、`generatedAt`、`counts` 和 `details`。

   备选方案是只在组件内保存点击后的临时面板状态，但刷新页面或切换路由后会丢失，不符合用户对运行结果的预期。另一个备选方案是把摘要拆成真实事件和章节写入 `events`、`chapterDraft` 或 `latestChapter`，但会破坏现有“手动记录事件才进入事件日志”的边界。

2. 使用独立的“运行一天” helper 生成结果摘要

   在 `src/lib/world-runtime.ts` 中新增或改造 helper，例如 `runWorldRuntimeOneDay(state, context)`，统一完成日期推进、运行天数加一和 `lastRunResult` 生成。为了保持兼容，可以让现有 `advanceWorldRuntimeOneDay` 委托新 helper，或保留旧函数给只需要日期推进的调用。

   结果摘要首版采用本地可解释规则生成：优先使用运行记录、角色种子、关系种子和默认工作台数据派生明细；没有足够上下文时仍生成结构完整的零值或可读回退。这样能提供稳定产品反馈，同时避免假装已经接入真实 Agent。

3. 结果面板放在右侧信息栏当前时间之后

   用户提出的是侧边栏运行界面，当前代码中最接近的侧边栏是 `RightRail`。桌面端将结果面板放在当前时间卡片下方，窄屏端沿用 right rail 的纵向滚动顺序。运行按钮仍位于现有运行状态模块，但文案改为“运行一天”，点击后右侧结果面板更新。

   备选方案是把结果面板嵌入 `StatsAndRuntime`。这样实现更少传参，但桌面信息层级会挤压运行状态卡，也不符合“侧边栏”的表达。

4. localStorage 版本保持 `version: 2`

   `lastRunResult` 是 additive 字段，解析层可以为旧记录补 `null`，因此不需要提升外层存储版本。`normalizeWorldRuntimeState` 负责校验 counts 非负、details 为字符串数组、必要字段缺失时回退到 `null`。

   备选方案是升级到 `version: 3` 并迁移所有记录，但当前没有破坏性数据结构变更，会增加不必要的迁移复杂度。

## Risks / Trade-offs

- [Risk] 用户可能把本地摘要误解为真实 Agent 运行结果 → Mitigation：文案保持为“本轮变化”与可扫描事实摘要，不声称已执行真实智能体；后续接入 Agent 时复用同一结果结构。
- [Risk] 本地规则生成的摘要可能重复 → Mitigation：生成时结合当前日期、运行天数、已有事件、角色和关系种子，确保同一世界连续运行时内容有基础变化。
- [Risk] 面板明细过长导致右侧栏溢出 → Mitigation：限制每类明细展示数量，长文本换行或截断，窄屏端保持纵向滚动。
- [Risk] 旧 localStorage 数据缺少新增字段或字段损坏 → Mitigation：解析层集中 normalize，无法解析的 `lastRunResult` 回退为 `null`，不阻断页面渲染。
- [Risk] 自动摘要与事件日志边界混淆 → Mitigation：`lastRunResult` 不自动追加到 `events`，完整事件日志仍只读取显式保存的事件。

## Migration Plan

1. 扩展运行记录类型和默认值，新增 `lastRunResult: null`。
2. 在运行记录解析中加入 `parseRunResult`，兼容旧记录、缺失字段和损坏字段。
3. 新增“运行一天” helper，保存日期推进、运行天数和最近运行结果。
4. 更新工作台运行按钮文案和点击处理，将结果传入右侧信息栏。
5. 新增结果面板组件和样式，覆盖空状态、非空结果、长文本和窄屏布局。
6. 运行类型检查、lint 和浏览器截图或 Playwright 验证。

回滚时删除结果面板渲染、恢复按钮文案和旧的 `advanceWorldRuntimeOneDay` 调用；`lastRunResult` 字段可留在 localStorage 中，旧代码忽略该字段即可。

## Open Questions

- 五类统计的首版默认数量是否固定为示例口径，还是按角色、关系和事件种子进行轻量派生。
- 结果明细是否需要提供“展开全部”或跳转到事件日志的入口。
- 后续真实 Agent 输出接入时，是否沿用 `WorldRuntimeRunResult` 作为前后端契约。
