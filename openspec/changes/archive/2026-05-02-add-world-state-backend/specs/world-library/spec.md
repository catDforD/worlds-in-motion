## MODIFIED Requirements

### Requirement: 本地世界库
系统 SHALL 以后端世界库作为主要事实源，用于保存多个世界记录和当前 active world ID；浏览器本地世界库仅作为旧数据导入和后端不可用时的演示回退。

#### Scenario: 初始化空世界库
- **GIVEN** 后端数据库不存在世界记录且浏览器本地不存在可迁移旧数据
- **WHEN** 用户进入工作台或创建页需要读取世界库
- **THEN** 系统 MUST 返回可用的空世界库或默认世界上下文，并且不得阻断页面渲染

#### Scenario: 读取已有世界库
- **GIVEN** 后端已经保存多个世界记录和 active world ID
- **WHEN** 系统读取世界库
- **THEN** 系统 MUST 恢复所有有效世界记录，并将 active world ID 指向一个存在的世界

#### Scenario: 世界库数据损坏时回退
- **GIVEN** 后端返回的世界库数据无法解析、版本不匹配或 active world ID 指向不存在的世界
- **WHEN** 系统读取世界库
- **THEN** 系统 MUST 显示可读错误或回退到可用默认状态，并且不得让创建页或工作台渲染失败

### Requirement: 世界记录标识
系统 SHALL 为每个后端世界记录维护稳定 `worldId`，并使用该 ID 关联世界设定、内容种子和运行记录。

#### Scenario: 新世界获得稳定 ID
- **GIVEN** 用户创建一个新世界
- **WHEN** 后端写入世界库记录
- **THEN** 系统 MUST 为该世界生成非空且在后端世界库中唯一的 `worldId`

#### Scenario: 世界名称变化不改变 ID
- **GIVEN** 世界库中已经存在一个世界记录
- **WHEN** 用户后续修改该世界名称或设定内容
- **THEN** 系统 MUST 保持该世界的 `worldId` 不变

### Requirement: 创建多个世界
系统 SHALL 允许用户通过后端创建多个世界记录，并保留既有世界及其服务端状态。

#### Scenario: 创建第二个世界
- **GIVEN** 后端世界库中已经存在一个世界记录
- **WHEN** 用户从创建页提交另一个世界
- **THEN** 系统 MUST 新增一条世界记录，而不是覆盖已有世界记录

#### Scenario: 创建后激活新世界
- **GIVEN** 用户从创建页提交新世界
- **WHEN** 后端完成保存
- **THEN** 系统 MUST 将新世界的 `worldId` 保存为 active world ID

### Requirement: 切换当前世界
系统 SHALL 提供切换 active world 的能力，并让工作台展示切换后的后端世界状态。

#### Scenario: 切换到已有世界
- **GIVEN** 后端世界库中存在至少两个世界记录
- **WHEN** 用户选择其中一个非 active 世界
- **THEN** 系统 MUST 将 active world ID 更新为所选世界的 `worldId`

#### Scenario: 切换后刷新工作台状态
- **GIVEN** 用户已经切换 active world
- **WHEN** 工作台重新读取后端状态
- **THEN** 系统 MUST 展示该 `worldId` 对应的世界设定、内容种子和运行记录

#### Scenario: 拒绝切换到不存在的世界
- **GIVEN** 用户或旧数据提供了不存在于后端世界库中的 `worldId`
- **WHEN** 系统尝试切换 active world
- **THEN** 系统 MUST 保持当前可用 active world 或回退到第一个有效世界，并且不得写入无效 active world ID

### Requirement: 旧单世界数据迁移
系统 SHALL 在首次接入后端世界库时迁移旧 localStorage 单世界数据，并把迁移结果绑定到同一个后端 `worldId`。

#### Scenario: 迁移旧创建世界和设定
- **GIVEN** 浏览器存在旧创建世界临时状态或旧世界设定状态，且后端不存在对应世界
- **WHEN** 用户确认或系统执行旧数据导入
- **THEN** 系统 MUST 创建一个后端世界记录，并把可解析的旧设定保存到该世界的 `worldId` 下

#### Scenario: 迁移旧内容种子和运行记录
- **GIVEN** 浏览器存在旧内容种子或旧运行记录，且后端不存在对应世界
- **WHEN** 用户确认或系统执行旧数据导入
- **THEN** 系统 MUST 将可解析的旧内容种子和运行记录保存到迁移世界的同一个 `worldId` 下

#### Scenario: 迁移后使用新结构
- **GIVEN** 系统已经完成旧单世界数据迁移
- **WHEN** 用户刷新页面并重新进入工作台
- **THEN** 系统 MUST 优先读取后端世界库和按 `worldId` 作用域的后端状态
