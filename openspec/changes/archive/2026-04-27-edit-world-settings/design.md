## Context

当前前端已经有 Next.js App Router 工程、根路径水墨工作台和 `/worlds/new` 创建世界页面。创建流程使用 `WorldCreationForm` 收集世界名称、类型、背景简介、叙事风格、世界规则和初始冲突，并通过 `sessionStorage` 把创建后的基本信息带回工作台顶部横幅。

这次变更要补齐“当前世界设定可编辑”的前端闭环。它不是完整世界模型、世界列表或后端持久化，而是在工作台内让用户修改核心设定，并把结果保存到浏览器本地状态。主要受影响模块包括：

- `src/components/dashboard/ink-dashboard.tsx`
- `src/components/world-creation/create-world-page.tsx`
- `src/lib/world-creation.ts` 或新增 `src/lib/world-settings.ts`
- `src/types/world-creation.ts` 或新增 `src/types/world-settings.ts`
- `src/app/globals.css`

## Goals / Non-Goals

**Goals:**

- 在工作台“世界设定”按钮上提供可操作入口。
- 支持编辑世界背景、世界规则、风格偏好、禁止事项、核心矛盾。
- 使用浏览器本地状态保存设定，刷新后可恢复。
- 保存后立即更新工作台顶部横幅可展示信息。
- 兼容现有创建页保存的数据，避免已有创建流程失效。
- 保持水墨视觉风格和桌面、窄屏可用性。

**Non-Goals:**

- 不新增后端 API、数据库表、迁移脚本或鉴权逻辑。
- 不实现多世界列表、世界切换、云端同步或协作编辑。
- 不触发角色生成、势力生成、Agent 世界运行或 LLM 调用。
- 不解析、推导或执行用户填写的世界规则与禁止事项。
- 不重构整个 dashboard 数据模型或替换所有 mock 模块。

## Decisions

1. 使用新的 `WorldSettings` 类型作为编辑态数据模型。

   理由：创建表单字段和“当前世界设定”字段高度相似，但语义不同。创建页的 `narrativeStyle` 和 `initialConflict` 更像初始输入；编辑态应使用更稳定的 `stylePreferences` 和 `coreConflict`，并新增 `prohibitedContent`。

   备选方案：继续扩展 `WorldCreationForm`。该方案改动少，但会把创建流程和长期设定维护绑定在一起，后续接后端世界模型时更难区分“创建输入”和“当前状态”。

2. 使用版本化 `localStorage` key 保存当前世界设定。

   建议 key：`worlds-in-motion.world-settings.v1`。

   理由：用户是在修改当前世界设定，刷新后丢失会破坏预期。`localStorage` 比 `sessionStorage` 更符合“本地保存”语义，同时仍然不引入后端持久化。

   备选方案：继续使用 `sessionStorage`。该方案和当前代码一致，但刷新浏览器会丢失编辑结果，不适合设定编辑。仅用 React state 也能完成单页体验，但不能满足刷新恢复。

3. 封装轻量 client store 处理读取、保存、订阅和迁移。

   理由：浏览器原生 `storage` 事件通常不通知同一页面内的写入方。若编辑面板保存后只写 `localStorage`，dashboard 可能不能立即更新。封装 `getStoredWorldSettings`、`saveWorldSettings`、`subscribeToWorldSettings` 可以同时完成写入和本页通知。

   备选方案：把编辑状态全部提升到 `InkDashboard`。该方案短期简单，但会让创建页初始化、刷新恢复和未来后端替换更分散。

4. 编辑界面使用工作台内面板，而不是跳转到 `/worlds/new`。

   理由：`/worlds/new` 是新建世界入口；编辑当前世界应保持在工作台上下文内。桌面端适合右侧抽屉或覆盖面板，窄屏端可以降级为全宽可滚动面板。

   备选方案：复用创建页作为编辑页。该方案复用度高，但会混淆“新建”和“编辑”，并且创建页已有类型选择和创建预览，不完全匹配设定维护。

5. 保存后只联动 dashboard 顶部横幅，不驱动运行模块变化。

   理由：当前运行状态、事件、角色和右侧栏仍是静态 mock 数据。前端不应根据用户填写的规则直接拼接复杂业务状态，也不应伪造 Agent 运行结果。

   备选方案：把核心矛盾或规则同步到事件、秘密、趋势等模块。该方案看起来更完整，但会越界到世界运行逻辑，容易制造不真实的业务语义。

## Risks / Trade-offs

- [Risk] 本地保存的数据结构未来需要迁移到后端世界模型。→ Mitigation：使用版本化 key 和独立 `WorldSettings` 类型，集中封装解析和迁移逻辑。
- [Risk] 用户输入非常长时，面板和横幅可能溢出。→ Mitigation：编辑字段使用可滚动长文本输入；横幅只展示背景摘要和风格标签，长文本换行或截断。
- [Risk] 禁止事项属于安全和内容边界，但本阶段不会被执行。→ Mitigation：界面文案应表达“保存设定”，不暗示系统已经强制执行；后续 Agent 接入时再定义执行规则。
- [Risk] `localStorage` 只能存储同一浏览器本地数据。→ Mitigation：规格明确本阶段为纯前端本地状态，不承诺跨设备同步。
- [Risk] 创建页与编辑面板同时维护相似字段，容易产生重复逻辑。→ Mitigation：抽取 shared helper 做创建表单到 `WorldSettings` 的映射，并复用字段标签或占位语常量。

## Migration Plan

1. 新增 `WorldSettings` 类型和本地存储 helper。
2. 从现有 `WorldCreationForm` 映射生成 `WorldSettings`，兼容旧 `sessionStorage` 创建状态作为回退。
3. 在 `InkDashboard` 中读取 `WorldSettings`，没有本地设定时继续使用 `dashboardData.world`。
4. 将“世界设定”按钮接入编辑面板，保存后写入本地状态并通知 dashboard 更新。
5. 增加样式和响应式处理，保证桌面和窄屏可编辑。
6. 运行 `npm run lint` 与 `npm run typecheck`，必要时使用浏览器截图验证。

回滚策略：

- 删除新增编辑组件、本地设定 helper 和样式。
- 恢复“世界设定”按钮为静态按钮。
- 创建页恢复为仅写入原有创建临时状态。
- 工作台继续只使用默认 mock 数据或原创建映射结果。

## Open Questions

- 编辑面板是否允许修改世界名称和世界类型？本变更核心字段不要求，但实现时可以保留只读摘要或提供基础字段编辑入口。
- 禁止事项的字段名称最终是否使用“禁止事项”“内容边界”或“不可发生”？建议先使用用户提出的“禁止事项”，后续由产品/叙事设计统一语气。
- 保存成功是否需要显式 toast？当前项目尚无 toast 组件，首版可以用按钮状态或面板关闭反馈，避免新增依赖。
