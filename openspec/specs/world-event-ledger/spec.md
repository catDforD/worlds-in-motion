# world-event-ledger Specification

## Purpose
定义后端世界运行记录能力，用于维护 active world 的当前时间、运行天数、暂停状态、事件列表、章节草稿和最新章节，并明确首版不会触发 Agent 运行。
## Requirements
### Requirement: 后端世界运行记录
系统 SHALL 在后端按 active `worldId` 维护 `WorldRuntimeState`，用于记录对应世界的当前世界时间、运行天数、暂停状态、事件列表、章节草稿和最新章节。

#### Scenario: 初始化后端运行记录
- **GIVEN** 用户首次访问某个 active world 且后端没有该 `worldId` 的世界运行记录
- **WHEN** 系统读取 `WorldRuntimeState`
- **THEN** 系统 MUST 创建或返回包含当前世界时间、运行天数、暂停状态、空事件列表、章节草稿和最新章节默认值的可用运行记录

#### Scenario: 持久化运行记录
- **GIVEN** 用户修改 active world 的暂停状态、推进日期或记录事件
- **WHEN** 修改操作完成
- **THEN** 系统 MUST 将更新后的 `WorldRuntimeState` 保存到 active `worldId` 对应的后端运行记录

#### Scenario: 重新加载后恢复运行记录
- **GIVEN** 用户已经在后端保存 active world 的世界运行记录
- **WHEN** 用户刷新页面或重新访问工作台
- **THEN** 系统 MUST 从后端恢复 active `worldId` 对应的当前世界时间、运行天数、暂停状态、事件列表、章节草稿和最新章节

#### Scenario: 切换世界后恢复对应运行记录
- **GIVEN** 两个世界分别保存了不同的运行记录
- **WHEN** 用户切换 active world
- **THEN** 系统 MUST 在运行状态、事件列表和最新章节模块展示切换后 `worldId` 对应的后端运行记录

#### Scenario: 后端记录损坏时回退
- **GIVEN** 后端返回的运行记录缺失必要字段或无法解析
- **WHEN** 系统读取 `WorldRuntimeState`
- **THEN** 系统 MUST 使用 active world 的可读默认运行记录回退，并且 MUST NOT 让工作台渲染失败

### Requirement: 暂停与继续运行
系统 SHALL 允许用户在后端切换世界暂停状态，并将该状态用于工作台运行状态展示。

#### Scenario: 暂停运行
- **GIVEN** 后端世界运行记录处于运行中
- **WHEN** 用户点击“暂停运行”
- **THEN** 系统 MUST 将 `WorldRuntimeState.isPaused` 保存为 `true`，并在工作台显示暂停状态

#### Scenario: 继续运行
- **GIVEN** 后端世界运行记录处于暂停中
- **WHEN** 用户点击继续运行操作
- **THEN** 系统 MUST 将 `WorldRuntimeState.isPaused` 保存为 `false`，并在工作台显示运行状态

#### Scenario: 暂停状态不触发自动运行
- **GIVEN** 用户切换暂停或继续状态
- **WHEN** 系统保存状态
- **THEN** 系统 MUST NOT 触发 Agent 世界运行

### Requirement: 手动推进一日
系统 SHALL 提供轻量手动入口，允许用户将后端世界时间推进一日、增加运行天数，并保存最近一次运行结果摘要。

#### Scenario: 推进一日
- **GIVEN** 工作台已加载后端世界运行记录
- **WHEN** 用户执行“运行一天”或兼容的“推进一日”操作
- **THEN** 系统 MUST 将当前世界时间推进到下一日，将运行天数增加 1，并生成最近一次运行结果摘要

#### Scenario: 推进一日后持久化
- **GIVEN** 用户已经执行“运行一天”或兼容的“推进一日”操作
- **WHEN** 页面重新加载
- **THEN** 系统 MUST 显示后端保存的推进后的当前世界时间、运行天数和最近一次运行结果摘要

#### Scenario: 推进一日不自动写入事件日志
- **GIVEN** 用户只执行“运行一天”或兼容的“推进一日”操作且没有填写事件内容
- **WHEN** 系统保存运行记录
- **THEN** 系统 MUST NOT 向 `WorldRuntimeState.events` 自动追加事件，MUST NOT 覆盖 `chapterDraft` 或 `latestChapter`，并且 MUST NOT 改写角色、关系或世界种子记录

### Requirement: 手动记录事件
系统 SHALL 允许用户通过轻量入口手动创建世界运行事件；事件标题和摘要为必要内容，参与角色、地点、事件影响、事件详情、事件类型和重要性为可选结构化字段，并将事件保存到后端运行记录。

#### Scenario: 创建事件
- **GIVEN** 用户在记录事件入口填写事件标题、摘要，并可选填写参与角色、地点、事件影响、事件详情、事件类型或重要性
- **WHEN** 用户提交事件
- **THEN** 系统 MUST 将事件加入 `WorldRuntimeState.events`，记录事件日期和创建时间，并保存所有已填写的结构化事实字段

#### Scenario: 显示最新事件优先
- **GIVEN** 后端世界运行记录中存在多条事件
- **WHEN** 系统读取事件列表用于工作台或事件日志页面展示
- **THEN** 系统 MUST 以最新创建或最新发生的事件优先展示事件

#### Scenario: 拒绝空事件
- **GIVEN** 用户没有填写事件标题或摘要中的必要内容
- **WHEN** 用户提交事件
- **THEN** 系统 MUST 阻止保存空事件，并保持已有事件列表不变

#### Scenario: 记录事件不触发 Agent
- **GIVEN** 用户提交手动事件
- **WHEN** 系统保存事件
- **THEN** 系统 MUST NOT 调用叙事生成、角色行动或其他 Agent 流程

### Requirement: 后端章节记录
系统 SHALL 在后端 `WorldRuntimeState` 中维护章节草稿和最新章节，用于支撑工作台最新故事章节展示。

#### Scenario: 读取章节草稿
- **GIVEN** 后端运行记录中包含章节草稿
- **WHEN** 工作台渲染最新故事章节模块
- **THEN** 系统 MUST 显示 `WorldRuntimeState.chapterDraft`

#### Scenario: 读取最新章节
- **GIVEN** 后端运行记录中包含最新章节
- **WHEN** 工作台渲染最新故事章节模块
- **THEN** 系统 MUST 显示 `WorldRuntimeState.latestChapter`

#### Scenario: 无章节记录时使用默认章节
- **GIVEN** 后端运行记录没有最新章节
- **WHEN** 工作台渲染最新故事章节模块
- **THEN** 系统 MUST 使用可读默认章节展示，而不是显示空白模块或报错

### Requirement: 后端首版边界
系统 SHALL 将世界运行记录首版限制在后端持久化和手动维护范围内。

#### Scenario: 不触发 Agent
- **GIVEN** 用户维护后端世界运行记录
- **WHEN** 任一运行记录操作完成
- **THEN** 系统 MUST NOT 触发 LangGraph、角色行动、叙事生成或其他 Agent 工作流

### Requirement: 结构化事件事实字段
系统 SHALL 在 `WorldRuntimeEvent` 中维护可用于故事生成的结构化事实字段，包括参与角色、地点、事件影响、事件详情和重要性，并保持旧事件记录兼容。

#### Scenario: 新事件包含结构化事实字段
- **GIVEN** 用户或界面逻辑创建事件时提供参与角色、地点、事件影响、事件详情或重要性
- **WHEN** 系统保存事件到 `WorldRuntimeState.events`
- **THEN** 系统 MUST 保留这些结构化事实字段，并继续保留事件 ID、时间、标题、摘要、类型和创建时间

#### Scenario: 旧事件记录兼容
- **GIVEN** 后端运行记录中存在旧事件，且旧事件缺少参与角色、地点、事件影响、事件详情或重要性字段
- **WHEN** 系统解析 `WorldRuntimeState.events`
- **THEN** 系统 MUST 将旧事件解析为可展示事件，并为缺失字段提供空数组、空字符串、默认重要性或摘要回退

#### Scenario: 可选事实字段不阻止保存
- **GIVEN** 用户只填写事件标题和摘要，没有填写参与角色、地点、影响或详情
- **WHEN** 用户提交事件
- **THEN** 系统 MUST 允许保存事件，并为可选事实字段写入可解析的默认值

#### Scenario: 事件事实字段重新加载后保留
- **GIVEN** 用户已经保存包含参与角色、地点、事件影响、事件详情和重要性的事件
- **WHEN** 页面刷新并重新读取后端世界运行记录
- **THEN** 系统 MUST 恢复这些结构化事实字段，而不是只保留标题和摘要

### Requirement: 最近运行结果摘要
系统 SHALL 在 `WorldRuntimeState` 中维护最近一次运行结果摘要，用于记录本轮运行的统计、明细、发生日期、运行天数和生成时间。

#### Scenario: 保存最近运行结果摘要
- **GIVEN** 用户执行“运行一天”
- **WHEN** 系统保存后端世界运行记录
- **THEN** 系统 MUST 在 active `worldId` 对应的 `WorldRuntimeState.lastRunResult` 中保存本轮事件数、关系变化数、秘密发现数、角色目标改变数、故事草稿生成数、分类明细、发生日期、运行天数和生成时间

#### Scenario: 运行结果统计为非负数
- **GIVEN** 系统解析或生成最近运行结果摘要
- **WHEN** 结果摘要包含任一统计字段
- **THEN** 系统 MUST 将统计字段规范化为非负整数，并为缺失统计使用 0

#### Scenario: 运行结果明细可选
- **GIVEN** 最近运行结果摘要缺少某个分类的明细
- **WHEN** 系统解析该摘要
- **THEN** 系统 MUST 使用空明细列表回退，并保留该分类的统计值

#### Scenario: 旧运行记录兼容
- **GIVEN** 后端运行记录缺少 `lastRunResult`
- **WHEN** 系统解析 `WorldRuntimeState`
- **THEN** 系统 MUST 将最近运行结果解析为 `null`，并继续恢复当前世界时间、运行天数、暂停状态、事件列表、章节草稿和最新章节

#### Scenario: 损坏运行结果回退
- **GIVEN** 后端运行记录中的 `lastRunResult` 字段无法解析或缺少必要结构
- **WHEN** 系统读取 `WorldRuntimeState`
- **THEN** 系统 MUST 丢弃损坏的最近运行结果并使用 `null` 回退，且 MUST NOT 让工作台或事件日志页面渲染失败

#### Scenario: 最近运行结果按世界隔离
- **GIVEN** 两个 active world 分别保存了不同的最近运行结果
- **WHEN** 用户切换 active world
- **THEN** 系统 MUST 只读取切换后 `worldId` 对应的最近运行结果

#### Scenario: 运行结果不触发 Agent
- **GIVEN** 用户执行“运行一天”并生成最近运行结果摘要
- **WHEN** 系统保存后端运行记录
- **THEN** 系统 MUST NOT 触发 LangGraph、角色行动、叙事生成或其他 Agent 工作流
