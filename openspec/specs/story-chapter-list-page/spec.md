# story-chapter-list-page Specification

## Purpose
TBD - created by archiving change add-story-chapter-list-page. Update Purpose after archive.
## Requirements
### Requirement: 故事章节列表页面访问
系统 SHALL 提供故事章节列表页，用于集中展示首版 mock 故事章节内容。

#### Scenario: 访问故事章节列表页
- **GIVEN** 用户已经进入应用
- **WHEN** 用户访问故事章节列表页
- **THEN** 系统 MUST 展示故事章节列表页标题、章节数量或状态信息，以及章节列表区域

#### Scenario: 页面无章节时显示空状态
- **GIVEN** 故事章节数据为空
- **WHEN** 用户访问故事章节列表页
- **THEN** 系统 MUST 显示可读空状态和返回工作台入口，而不是显示空白页面或渲染失败

#### Scenario: 从工作台入口进入章节列表
- **GIVEN** 工作台提供故事章节或继续阅读入口
- **WHEN** 用户点击该入口
- **THEN** 系统 MUST 导航到故事章节列表页或对应章节阅读页，而不是停留在无效占位链接

### Requirement: 章节列表元信息展示
系统 SHALL 在故事章节列表页展示每个章节的标题、生成时间、对应世界时间、主要角色、摘要和阅读按钮。

#### Scenario: 显示章节核心字段
- **GIVEN** mock 故事章节中存在标题、生成时间、世界时间、主要角色和摘要
- **WHEN** 系统渲染章节列表
- **THEN** 系统 MUST 在每个章节条目中显示章节标题、生成时间、对应世界时间、主要角色、摘要和阅读按钮

#### Scenario: 多名主要角色可读展示
- **GIVEN** 某个章节包含多个主要角色
- **WHEN** 系统渲染该章节条目
- **THEN** 系统 MUST 以可扫描的文本或标签形式展示所有主要角色，并且 MUST NOT 让角色列表遮挡摘要或按钮

#### Scenario: 字段缺失时展示回退
- **GIVEN** 某个章节缺少生成时间、世界时间、主要角色或摘要
- **WHEN** 系统渲染该章节条目
- **THEN** 系统 MUST 使用可读占位或空状态文案补齐缺失字段，并且 MUST NOT 让页面渲染失败

#### Scenario: 章节按生成顺序可扫描
- **GIVEN** mock 故事章节中存在多章内容
- **WHEN** 系统渲染章节列表
- **THEN** 系统 MUST 使用稳定顺序展示章节，并让用户能够区分章节编号、生成时间或章节先后关系

### Requirement: 章节阅读入口
系统 SHALL 让每个章节的阅读按钮具备实际可验证的阅读行为。

#### Scenario: 点击阅读按钮进入章节阅读
- **GIVEN** 用户正在查看故事章节列表页且某个章节存在正文或正文占位
- **WHEN** 用户点击该章节的阅读按钮
- **THEN** 系统 MUST 展示该章节的可读内容，并保留章节标题、对应世界时间和主要角色信息

#### Scenario: 阅读页可返回列表
- **GIVEN** 用户正在查看某个章节的阅读内容
- **WHEN** 用户点击返回列表或回到章节列表入口
- **THEN** 系统 MUST 返回故事章节列表页，并保持页面可继续浏览其他章节

#### Scenario: 访问不存在章节时回退
- **GIVEN** 用户访问不存在的章节阅读地址或选择了无效章节
- **WHEN** 系统无法找到匹配章节
- **THEN** 系统 MUST 显示可读错误或空状态，并提供返回故事章节列表页的入口

### Requirement: 首版 mock 数据边界
系统 SHALL 将故事章节列表页首版限制为前端 mock 展示，不触发真实生成、后端持久化或后端运行记录写入。

#### Scenario: 页面加载不调用后端
- **GIVEN** 用户访问故事章节列表页
- **WHEN** 系统加载章节列表和阅读内容
- **THEN** 系统 MUST NOT 调用 FastAPI、数据库接口或任何远程持久化接口

#### Scenario: 页面展示不触发 Agent
- **GIVEN** 用户访问、浏览或阅读 mock 故事章节
- **WHEN** 系统更新故事章节页面展示
- **THEN** 系统 MUST NOT 触发 LangGraph、角色行动、世界推进、事件总结或故事生成工作流

#### Scenario: mock 展示不改写后端运行记录
- **GIVEN** 浏览器中存在 active world 的后端运行记录
- **WHEN** 用户访问故事章节列表页或阅读 mock 章节
- **THEN** 系统 MUST NOT 写入或改写 `WorldRuntimeState`、active world 或事件日志数据

### Requirement: 响应式与前端质量
系统 SHALL 保持故事章节列表页和阅读入口在桌面端与窄屏端可读，并提供可验证的前端质量结果。

#### Scenario: 桌面端章节列表可读
- **GIVEN** 用户使用桌面宽屏视口访问故事章节列表页
- **WHEN** 页面渲染完成
- **THEN** 系统 MUST 保持章节标题、生成时间、世界时间、主要角色、摘要和阅读按钮在各自容器内可见，且不得出现明显互相遮挡

#### Scenario: 窄屏端章节列表可滚动浏览
- **GIVEN** 用户使用窄屏视口访问故事章节列表页
- **WHEN** 页面渲染完成
- **THEN** 系统 MUST 将章节列表降级为可滚动的单列或等价窄屏布局，并保持阅读按钮可点击

#### Scenario: 长文本受控
- **GIVEN** mock 章节中存在较长标题、主要角色列表、摘要或正文
- **WHEN** 对应列表条目或阅读视图渲染完成
- **THEN** 系统 MUST 通过换行、截断或限定宽度处理长文本，避免撑破容器或覆盖相邻内容

#### Scenario: 静态检查通过
- **GIVEN** 故事章节列表页实现完成
- **WHEN** 开发者运行项目静态检查或类型检查命令
- **THEN** 系统 MUST 在无 TypeScript 和 lint 错误的情况下完成检查
