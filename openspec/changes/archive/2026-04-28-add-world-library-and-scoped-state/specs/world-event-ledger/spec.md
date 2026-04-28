## MODIFIED Requirements

### Requirement: 本地世界运行记录
系统 SHALL 在前端本地按 active `worldId` 维护 `WorldRuntimeState`，用于记录对应世界的当前世界时间、运行天数、暂停状态、事件列表、章节草稿和最新章节。

#### Scenario: 初始化本地运行记录
- **GIVEN** 用户首次访问某个 active world 且本地没有该 `worldId` 的世界运行记录
- **WHEN** 系统读取 `WorldRuntimeState`
- **THEN** 系统 MUST 创建或返回包含当前世界时间、运行天数、暂停状态、空事件列表、章节草稿和最新章节默认值的可用运行记录

#### Scenario: 持久化运行记录
- **GIVEN** 用户修改 active world 的暂停状态、推进日期、记录事件或更新章节信息
- **WHEN** 修改操作完成
- **THEN** 系统 MUST 将更新后的 `WorldRuntimeState` 保存到 active `worldId` 对应的浏览器本地存储

#### Scenario: 重新加载后恢复运行记录
- **GIVEN** 用户已经在本地保存 active world 的世界运行记录
- **WHEN** 用户刷新页面或重新访问工作台
- **THEN** 系统 MUST 从本地存储恢复 active `worldId` 对应的当前世界时间、运行天数、暂停状态、事件列表、章节草稿和最新章节

#### Scenario: 切换世界后恢复对应运行记录
- **GIVEN** 两个世界分别保存了不同的运行记录
- **WHEN** 用户切换 active world
- **THEN** 系统 MUST 在运行状态、事件列表和最新章节模块展示切换后 `worldId` 对应的运行记录

#### Scenario: 本地记录损坏时回退
- **GIVEN** 浏览器本地存储中的运行记录缺失必要字段或无法解析
- **WHEN** 系统读取 `WorldRuntimeState`
- **THEN** 系统 MUST 使用 active world 的可读默认运行记录回退，并且 MUST NOT 让工作台渲染失败
