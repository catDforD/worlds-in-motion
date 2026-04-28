## MODIFIED Requirements

### Requirement: 创建后进入工作台
系统 SHALL 在首版创建世界成功后创建本地世界库记录，将该世界设为 active，并进入现有工作台展示该世界基本信息。

#### Scenario: 点击创建世界进入工作台
- **GIVEN** 用户已填写创建世界表单所需信息
- **WHEN** 用户点击“创建世界”
- **THEN** 系统 MUST 创建一条新的本地世界记录，将其 `worldId` 设为 active world ID，并导航到现有工作台视图

#### Scenario: 工作台展示新世界信息
- **GIVEN** 用户从创建世界页面完成创建并进入工作台
- **WHEN** 工作台顶部世界横幅渲染完成
- **THEN** 系统 MUST 显示 active world 对应的世界名称、背景简介和世界类型标签

#### Scenario: 创建新世界不覆盖旧世界
- **GIVEN** 世界库中已经存在一个世界及其设定、内容种子或运行记录
- **WHEN** 用户完成另一个世界的创建
- **THEN** 系统 MUST 保留旧世界记录及其按 `worldId` 作用域保存的状态

#### Scenario: 不触发后端持久化
- **GIVEN** 用户点击“创建世界”
- **WHEN** 系统处理首版创建流程
- **THEN** 系统 MUST NOT 调用后端创建世界接口、写入数据库或触发 Agent 世界运行
