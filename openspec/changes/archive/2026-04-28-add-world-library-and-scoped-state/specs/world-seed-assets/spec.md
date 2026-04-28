## MODIFIED Requirements

### Requirement: 内容种子本地保存与恢复
系统 SHALL 将世界内容种子按 active `worldId` 保存到浏览器本地状态，并在刷新或切换世界后恢复对应世界的内容种子。

#### Scenario: 保存内容种子到本地状态
- **GIVEN** 用户已经修改 active world 的角色、势力、地点或关系种子
- **WHEN** 用户点击保存操作
- **THEN** 系统 MUST 将完整内容种子集合保存到 active `worldId` 对应的浏览器本地状态

#### Scenario: 刷新后恢复内容种子
- **GIVEN** 用户已经保存过 active world 的世界内容种子
- **WHEN** 用户刷新浏览器并重新进入工作台
- **THEN** 系统 MUST 从浏览器本地状态恢复 active `worldId` 对应的角色、势力、地点和关系种子

#### Scenario: 切换世界后恢复对应内容种子
- **GIVEN** 两个世界分别保存了不同的内容种子
- **WHEN** 用户切换 active world
- **THEN** 系统 MUST 在编辑界面、统计概览、活跃角色和紧张关系模块展示切换后 `worldId` 对应的内容种子

#### Scenario: 本地种子数据损坏时回退
- **GIVEN** 浏览器本地状态中的内容种子数据无法解析或字段类型不符合预期
- **WHEN** 用户进入工作台或打开内容种子编辑界面
- **THEN** 系统 MUST 回退到 active world 的空种子或默认 mock 展示，并且不得阻断页面渲染

#### Scenario: 保存后不调用后端
- **GIVEN** 用户点击保存内容种子
- **WHEN** 系统处理保存操作
- **THEN** 系统 MUST NOT 调用后端接口、写入数据库或触发 Agent 世界运行
