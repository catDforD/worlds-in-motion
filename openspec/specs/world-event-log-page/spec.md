# world-event-log-page Specification

## Purpose
定义 active world 的完整事件日志页面，用于从后端事件记录读取、倒序浏览和查看事件详情，并保持首版不触发 Agent 工作流。
## Requirements
### Requirement: 事件日志页面入口
系统 SHALL 提供 active world 的完整事件日志页面，并允许用户从工作台进入该页面。

#### Scenario: 访问事件日志页面
- **GIVEN** 用户已经进入应用且存在 active world
- **WHEN** 用户访问事件日志页面
- **THEN** 系统 MUST 展示 active world 的事件日志标题、当前世界名称和事件列表区域

#### Scenario: 从近期事件进入完整日志
- **GIVEN** 用户正在查看工作台近期事件模块
- **WHEN** 用户点击“查看全部”或事件日志入口
- **THEN** 系统 MUST 导航到事件日志页面，而不是停留在占位链接

#### Scenario: 无 active world 时可读回退
- **GIVEN** 后端和浏览器均没有可用 active world
- **WHEN** 用户访问事件日志页面
- **THEN** 系统 MUST 显示可读的默认世界上下文或空状态，并且 MUST NOT 让页面渲染失败

### Requirement: 事件列表倒序展示
系统 SHALL 在事件日志页面展示 active world 的完整后端事件列表，默认按最新创建或最新发生的事件优先排序；当事件数量增加时，列表 MUST 在事件日志页面的列表区域内部滚动，而不是让页面无限拉长。

#### Scenario: 显示完整事件列表
- **GIVEN** active world 的后端运行记录中存在多条事件
- **WHEN** 事件日志页面加载完成
- **THEN** 系统 MUST 展示所有可解析事件，而不是只展示工作台近期事件数量

#### Scenario: 默认最新事件优先
- **GIVEN** active world 的后端运行记录中存在多条带有 `createdAt` 或 `date` 的事件
- **WHEN** 系统渲染事件列表
- **THEN** 系统 MUST 以最新创建或最新发生的事件优先排序

#### Scenario: 列表展示事件关键信息
- **GIVEN** 事件包含时间、标题、参与角色、地点、影响和摘要
- **WHEN** 系统渲染该事件列表项
- **THEN** 系统 MUST 在列表项中显示事件时间、事件标题、参与角色、地点、事件影响和摘要

#### Scenario: 旧事件字段缺失时展示回退
- **GIVEN** 旧事件只包含时间、标题、摘要、类型和创建时间
- **WHEN** 系统渲染该事件列表项
- **THEN** 系统 MUST 使用摘要、空状态或可读占位补齐缺失的参与角色、地点和影响展示

#### Scenario: 无事件时显示可创建空状态
- **GIVEN** active world 的后端运行记录中没有事件
- **WHEN** 事件日志页面加载完成
- **THEN** 系统 MUST 显示事件空状态和记录事件入口，而不是显示空白页面或要求用户回到工作台记录事件

#### Scenario: 大量事件时列表内部滚动
- **GIVEN** active world 的后端运行记录中存在超过一个视口可读范围的事件数量
- **WHEN** 事件日志页面渲染事件列表
- **THEN** 系统 MUST 保持事件列表区域可滚动，并且 MUST 保持详情区域或新建事件区域可见或可访问

### Requirement: 事件日志页手动记录事件
系统 SHALL 在事件日志页面提供手动记录事件入口，允许用户为 active world 创建结构化事件，并保存到对应 `WorldRuntimeState.events`。

#### Scenario: 打开记录事件模式
- **GIVEN** 用户正在访问事件日志页面且存在 active world
- **WHEN** 用户点击“记录事件”“新增事件”或等价入口
- **THEN** 系统 MUST 在事件日志页面展示记录事件表单，并保持事件列表仍可访问

#### Scenario: 创建事件
- **GIVEN** 用户在事件日志页记录事件表单填写事件标题、摘要，并可选填写参与角色、地点、事件影响、事件详情、事件类型或重要性
- **WHEN** 用户提交事件
- **THEN** 系统 MUST 将事件加入 active world 对应的 `WorldRuntimeState.events`，记录事件日期和创建时间，并保存所有已填写的结构化事实字段

#### Scenario: 保存后刷新并展示新事件
- **GIVEN** 用户已经在事件日志页成功创建事件
- **WHEN** 保存完成
- **THEN** 系统 MUST 刷新事件列表、以最新事件优先展示，并默认展示或选中新创建事件的详情

#### Scenario: 拒绝空事件
- **GIVEN** 用户没有填写事件标题或摘要中的必要内容
- **WHEN** 用户在事件日志页提交记录事件表单
- **THEN** 系统 MUST 阻止保存空事件，展示可读校验反馈，并保持已有事件列表不变

#### Scenario: 无 active world 时禁止创建
- **GIVEN** 后端没有可用 active world
- **WHEN** 用户访问事件日志页面
- **THEN** 系统 MUST 显示可读空状态，并且 MUST NOT 展示可提交的记录事件表单或写入后端运行记录

#### Scenario: 记录事件不触发 Agent
- **GIVEN** 用户在事件日志页提交手动事件
- **WHEN** 系统保存事件
- **THEN** 系统 MUST NOT 触发 LangGraph、角色行动、叙事生成或其他 Agent 工作流

### Requirement: 事件日志页新建表单可滚动
系统 SHALL 让事件日志页的新建事件表单在桌面和窄屏视口中均可完整填写、提交和取消，并避免长表单撑破页面布局。

#### Scenario: 桌面端新建表单不撑破双栏布局
- **GIVEN** 用户使用宽屏桌面视口访问事件日志页面
- **WHEN** 用户打开记录事件模式
- **THEN** 系统 MUST 在事件日志页面的详情或维护区域展示表单，并保持事件列表区域和表单区域边界清晰、可滚动访问

#### Scenario: 窄屏端新建表单可完整访问
- **GIVEN** 用户使用窄屏视口访问事件日志页面
- **WHEN** 用户打开记录事件模式
- **THEN** 系统 MUST 让标题、摘要、类型、重要性、参与角色、地点、影响、详情和提交操作全部可滚动访问，且主要文本不得互相遮挡或横向溢出

#### Scenario: 取消记录事件返回详情或空状态
- **GIVEN** 用户已经打开事件日志页记录事件模式
- **WHEN** 用户取消记录事件
- **THEN** 系统 MUST 返回最近选中事件详情；如果没有事件，则返回可读空状态

### Requirement: 事件详情展示
系统 SHALL 在事件日志页面提供事件详情视图，用于展示后续故事生成所需的事实底稿。

#### Scenario: 默认显示最新事件详情
- **GIVEN** 事件日志页面加载时存在至少一条事件
- **WHEN** 系统完成事件排序
- **THEN** 系统 MUST 默认显示最新事件的详情

#### Scenario: 选择事件后更新详情
- **GIVEN** 事件日志页面中存在多条事件
- **WHEN** 用户选择其中一条事件
- **THEN** 系统 MUST 在详情区域展示所选事件的时间、标题、参与角色、地点、影响、类型、重要性和详情

#### Scenario: 详情缺失时使用摘要回退
- **GIVEN** 事件没有单独的详情文本但存在摘要
- **WHEN** 系统展示该事件详情
- **THEN** 系统 MUST 使用事件摘要作为详情回退，并明确展示已有事实字段

#### Scenario: 窄屏端仍可查看详情
- **GIVEN** 用户使用窄屏视口访问事件日志页面
- **WHEN** 页面渲染完成
- **THEN** 系统 MUST 让事件列表和事件详情均可访问，并且主要文本不得互相遮挡或溢出容器

### Requirement: 事件日志读取 active world 后端状态
系统 SHALL 从 active `worldId` 对应的后端 `WorldRuntimeState.events` 读取事件日志数据。

#### Scenario: 只展示当前世界事件
- **GIVEN** 后端存在两个世界且各自保存了不同事件
- **WHEN** 用户访问事件日志页面
- **THEN** 系统 MUST 只展示 active world 对应 `worldId` 下的事件

#### Scenario: 切换世界后事件日志更新
- **GIVEN** 用户已经切换 active world
- **WHEN** 用户重新访问或刷新事件日志页面
- **THEN** 系统 MUST 展示切换后 active world 的事件列表和世界名称

#### Scenario: 后端运行记录损坏时回退
- **GIVEN** active world 的后端运行记录无法解析或缺失必要字段
- **WHEN** 用户访问事件日志页面
- **THEN** 系统 MUST 使用可读空状态回退，并且 MUST NOT 让页面渲染失败

### Requirement: 事件日志首版边界
系统 SHALL 将事件日志页面首版限制在后端展示和手动维护范围内。

#### Scenario: 页面展示不触发 Agent
- **GIVEN** 用户访问、筛选、选择或查看事件详情
- **WHEN** 系统更新事件日志页面展示
- **THEN** 系统 MUST NOT 触发 LangGraph、角色行动、叙事生成或其他 Agent 工作流
