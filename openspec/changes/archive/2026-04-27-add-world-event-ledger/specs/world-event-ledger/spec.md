## ADDED Requirements

### Requirement: 本地世界运行记录
系统 SHALL 在前端本地维护 `WorldRuntimeState`，用于记录当前世界时间、运行天数、暂停状态、事件列表、章节草稿和最新章节。

#### Scenario: 初始化本地运行记录
- **GIVEN** 用户首次访问工作台且本地没有世界运行记录
- **WHEN** 系统读取 `WorldRuntimeState`
- **THEN** 系统 MUST 创建或返回包含当前世界时间、运行天数、暂停状态、空事件列表、章节草稿和最新章节默认值的可用运行记录

#### Scenario: 持久化运行记录
- **GIVEN** 用户修改暂停状态、推进日期、记录事件或更新章节信息
- **WHEN** 修改操作完成
- **THEN** 系统 MUST 将更新后的 `WorldRuntimeState` 保存到浏览器本地存储

#### Scenario: 重新加载后恢复运行记录
- **GIVEN** 用户已经在本地保存世界运行记录
- **WHEN** 用户刷新页面或重新访问工作台
- **THEN** 系统 MUST 从本地存储恢复当前世界时间、运行天数、暂停状态、事件列表、章节草稿和最新章节

#### Scenario: 本地记录损坏时回退
- **GIVEN** 浏览器本地存储中的运行记录缺失必要字段或无法解析
- **WHEN** 系统读取 `WorldRuntimeState`
- **THEN** 系统 MUST 使用可读默认运行记录回退，并且 MUST NOT 让工作台渲染失败

### Requirement: 暂停与继续运行
系统 SHALL 允许用户在本地切换世界暂停状态，并将该状态用于工作台运行状态展示。

#### Scenario: 暂停运行
- **GIVEN** 本地世界运行记录处于运行中
- **WHEN** 用户点击“暂停运行”
- **THEN** 系统 MUST 将 `WorldRuntimeState.isPaused` 保存为 `true`，并在工作台显示暂停状态

#### Scenario: 继续运行
- **GIVEN** 本地世界运行记录处于暂停中
- **WHEN** 用户点击继续运行操作
- **THEN** 系统 MUST 将 `WorldRuntimeState.isPaused` 保存为 `false`，并在工作台显示运行状态

#### Scenario: 暂停状态不触发自动运行
- **GIVEN** 用户切换暂停或继续状态
- **WHEN** 系统保存状态
- **THEN** 系统 MUST NOT 调用后端接口、写入数据库或触发 Agent 世界运行

### Requirement: 手动推进一日
系统 SHALL 提供轻量手动入口，允许用户将本地世界时间推进一日并增加运行天数。

#### Scenario: 推进一日
- **GIVEN** 工作台已加载本地世界运行记录
- **WHEN** 用户执行“推进一日”
- **THEN** 系统 MUST 将当前世界时间推进到下一日，并将运行天数增加 1

#### Scenario: 推进一日后持久化
- **GIVEN** 用户已经执行“推进一日”
- **WHEN** 页面重新加载
- **THEN** 系统 MUST 显示推进后的当前世界时间和运行天数

#### Scenario: 推进一日不自动生成事件
- **GIVEN** 用户只执行“推进一日”且没有填写事件内容
- **WHEN** 系统保存运行记录
- **THEN** 系统 MUST NOT 伪造事件、章节或角色行动记录

### Requirement: 手动记录事件
系统 SHALL 允许用户通过轻量入口手动创建世界运行事件，并将事件保存到本地运行记录。

#### Scenario: 创建事件
- **GIVEN** 用户在记录事件入口填写事件标题和摘要
- **WHEN** 用户提交事件
- **THEN** 系统 MUST 将事件加入 `WorldRuntimeState.events`，并记录事件日期和创建时间

#### Scenario: 显示最新事件优先
- **GIVEN** 本地世界运行记录中存在多条事件
- **WHEN** 系统读取事件列表用于工作台展示
- **THEN** 系统 MUST 以最新创建或最新发生的事件优先展示近期事件

#### Scenario: 拒绝空事件
- **GIVEN** 用户没有填写事件标题或摘要中的必要内容
- **WHEN** 用户提交事件
- **THEN** 系统 MUST 阻止保存空事件，并保持已有事件列表不变

#### Scenario: 记录事件不触发 Agent
- **GIVEN** 用户提交手动事件
- **WHEN** 系统保存事件
- **THEN** 系统 MUST NOT 调用叙事生成、角色行动或其他 Agent 流程

### Requirement: 本地章节记录
系统 SHALL 在 `WorldRuntimeState` 中维护章节草稿和最新章节，用于支撑工作台最新故事章节展示。

#### Scenario: 保存章节草稿
- **GIVEN** 用户或界面逻辑更新章节草稿
- **WHEN** 系统保存运行记录
- **THEN** 系统 MUST 将章节草稿保存在 `WorldRuntimeState.chapterDraft`

#### Scenario: 保存最新章节
- **GIVEN** 用户或界面逻辑更新最新章节标题、摘要或标签
- **WHEN** 系统保存运行记录
- **THEN** 系统 MUST 将最新章节保存在 `WorldRuntimeState.latestChapter`

#### Scenario: 无章节记录时使用默认章节
- **GIVEN** 本地运行记录没有最新章节
- **WHEN** 工作台渲染最新故事章节模块
- **THEN** 系统 MUST 使用可读默认章节展示，而不是显示空白模块或报错

### Requirement: 本地首版边界
系统 SHALL 将世界运行记录首版限制在前端本地存储和手动维护范围内。

#### Scenario: 不调用后端
- **GIVEN** 用户读取、暂停、推进日期、记录事件或保存章节信息
- **WHEN** 系统处理这些运行记录操作
- **THEN** 系统 MUST NOT 调用 FastAPI、数据库接口或任何远程持久化接口

#### Scenario: 不触发 Agent
- **GIVEN** 用户维护本地世界运行记录
- **WHEN** 任一运行记录操作完成
- **THEN** 系统 MUST NOT 触发 LangGraph、角色行动、叙事生成或其他 Agent 工作流
