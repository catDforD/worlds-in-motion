## MODIFIED Requirements

### Requirement: 本地保存与恢复
系统 SHALL 将世界设定按 active `worldId` 保存到浏览器本地状态，并在刷新或切换世界后恢复对应世界的设定。

#### Scenario: 保存世界设定到本地状态
- **GIVEN** 用户已经修改 active world 的世界设定字段
- **WHEN** 用户点击保存操作
- **THEN** 系统 MUST 将世界设定保存到 active `worldId` 对应的浏览器本地状态

#### Scenario: 保存后不调用后端
- **GIVEN** 用户点击保存世界设定
- **WHEN** 系统处理保存操作
- **THEN** 系统 MUST NOT 调用后端世界接口、写入数据库或触发 Agent 世界运行

#### Scenario: 刷新后恢复世界设定
- **GIVEN** 用户已经保存过 active world 的世界设定
- **WHEN** 用户刷新浏览器并重新进入工作台
- **THEN** 系统 MUST 从浏览器本地状态恢复 active `worldId` 对应的已保存世界设定

#### Scenario: 切换世界后恢复对应设定
- **GIVEN** 两个世界分别保存了不同的世界设定
- **WHEN** 用户切换 active world
- **THEN** 系统 MUST 在工作台和设定编辑界面展示切换后 `worldId` 对应的设定

#### Scenario: 本地数据损坏时回退
- **GIVEN** 浏览器本地状态中的世界设定数据无法解析或字段类型不符合预期
- **WHEN** 用户进入工作台或打开世界设定编辑界面
- **THEN** 系统 MUST 回退到 active world 的基础信息、默认工作台世界信息或可读占位内容，并且不得阻断页面渲染

### Requirement: 创建流程兼容设定编辑
系统 SHALL 兼容创建世界流程产生的前端状态，并让 active world 可进入设定编辑。

#### Scenario: 创建后初始化可编辑设定
- **GIVEN** 用户在 `/worlds/new` 完成创建世界
- **WHEN** 系统进入工作台
- **THEN** 系统 MUST 让“世界设定”编辑界面显示 active world 创建时填写的背景、规则、风格和初始冲突对应内容

#### Scenario: 兼容旧创建临时状态
- **GIVEN** 浏览器中存在旧版创建世界临时状态但不存在新世界库
- **WHEN** 用户进入工作台
- **THEN** 系统 MUST 将旧版创建状态迁移为一个 active world，并可在打开编辑界面时映射为可编辑世界设定
