## ADDED Requirements

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
- **GIVEN** 浏览器本地没有可用 active world
- **WHEN** 用户访问事件日志页面
- **THEN** 系统 MUST 显示可读的默认世界上下文或空状态，并且 MUST NOT 让页面渲染失败

### Requirement: 事件列表倒序展示
系统 SHALL 在事件日志页面展示 active world 的完整事件列表，默认按最新创建或最新发生的事件优先排序。

#### Scenario: 显示完整事件列表
- **GIVEN** active world 的本地运行记录中存在多条事件
- **WHEN** 事件日志页面加载完成
- **THEN** 系统 MUST 展示所有可解析事件，而不是只展示工作台近期事件数量

#### Scenario: 默认最新事件优先
- **GIVEN** active world 的本地运行记录中存在多条带有 `createdAt` 或 `date` 的事件
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

#### Scenario: 无事件时显示空状态
- **GIVEN** active world 的本地运行记录中没有事件
- **WHEN** 事件日志页面加载完成
- **THEN** 系统 MUST 显示事件空状态和记录事件入口或返回工作台入口，而不是显示空白页面

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

### Requirement: 事件日志读取 active world 本地状态
系统 SHALL 从 active `worldId` 对应的本地 `WorldRuntimeState.events` 读取事件日志数据。

#### Scenario: 只展示当前世界事件
- **GIVEN** 本地存在两个世界且各自保存了不同事件
- **WHEN** 用户访问事件日志页面
- **THEN** 系统 MUST 只展示 active world 对应 `worldId` 下的事件

#### Scenario: 切换世界后事件日志更新
- **GIVEN** 用户已经切换 active world
- **WHEN** 用户重新访问或刷新事件日志页面
- **THEN** 系统 MUST 展示切换后 active world 的事件列表和世界名称

#### Scenario: 本地运行记录损坏时回退
- **GIVEN** active world 的本地运行记录无法解析或缺失必要字段
- **WHEN** 用户访问事件日志页面
- **THEN** 系统 MUST 使用可读空状态回退，并且 MUST NOT 让页面渲染失败

### Requirement: 事件日志首版边界
系统 SHALL 将事件日志页面首版限制在前端本地展示和手动维护范围内。

#### Scenario: 页面读取不调用后端
- **GIVEN** 用户访问事件日志页面
- **WHEN** 系统读取和展示事件
- **THEN** 系统 MUST NOT 调用 FastAPI、数据库接口或任何远程持久化接口

#### Scenario: 页面展示不触发 Agent
- **GIVEN** 用户访问、筛选、选择或查看事件详情
- **WHEN** 系统更新事件日志页面展示
- **THEN** 系统 MUST NOT 触发 LangGraph、角色行动、叙事生成或其他 Agent 工作流
