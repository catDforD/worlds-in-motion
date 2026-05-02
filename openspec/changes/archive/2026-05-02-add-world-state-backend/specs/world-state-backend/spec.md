## ADDED Requirements

### Requirement: 后端应用基础
系统 SHALL 提供 FastAPI 后端应用，用于承载世界状态 API、数据库连接、健康检查和后端测试入口。

#### Scenario: 健康检查可用
- **GIVEN** 后端服务已经启动
- **WHEN** 开发者或前端请求健康检查接口
- **THEN** 系统 MUST 返回服务可用状态，并且不得访问 LLM、LangGraph 或 Agent 工作流

#### Scenario: 数据库不可用时清晰失败
- **GIVEN** PostgreSQL 连接不可用
- **WHEN** 后端处理需要数据库的世界状态请求
- **THEN** 系统 MUST 返回可诊断的错误状态，并且 MUST NOT 返回伪造的成功写入结果

### Requirement: 世界状态数据库模型
系统 SHALL 在 PostgreSQL 中维护世界状态所需的数据模型，包括世界、active world、世界设定、内容种子、运行状态、事件和运行结果。

#### Scenario: 创建数据库迁移
- **GIVEN** 开发者初始化后端数据库
- **WHEN** 执行数据库迁移
- **THEN** 系统 MUST 创建保存世界状态所需的表、主键、外键和基础索引

#### Scenario: 世界级联关联
- **GIVEN** 数据库中存在一个世界
- **WHEN** 系统保存该世界的设定、内容种子、运行状态、事件或运行结果
- **THEN** 系统 MUST 使用稳定 `worldId` 将这些记录关联到同一个世界

#### Scenario: 删除或缺失世界时拒绝孤儿状态
- **GIVEN** 请求引用了不存在的 `worldId`
- **WHEN** 系统尝试写入设定、内容种子、运行状态、事件或运行结果
- **THEN** 系统 MUST 拒绝写入孤儿状态，并返回可读错误

### Requirement: 世界库 API
系统 SHALL 提供世界库 API，用于读取世界列表、创建世界、读取 active world、设置 active world 和读取单个世界快照。

#### Scenario: 读取世界库
- **GIVEN** 后端数据库中存在多个世界记录
- **WHEN** 前端请求世界库
- **THEN** 系统 MUST 返回所有有效世界记录和当前 active world ID

#### Scenario: 创建世界
- **GIVEN** 前端提交世界名称、类型、描述和标签
- **WHEN** 后端创建世界
- **THEN** 系统 MUST 生成稳定 `worldId`、写入世界记录、初始化运行状态，并可将新世界设为 active world

#### Scenario: 设置 active world
- **GIVEN** 后端数据库中存在目标世界
- **WHEN** 前端请求切换 active world
- **THEN** 系统 MUST 保存新的 active world ID，并在后续世界库请求中返回该值

#### Scenario: 拒绝无效 active world
- **GIVEN** 前端请求切换到不存在的世界
- **WHEN** 后端处理 active world 更新
- **THEN** 系统 MUST 拒绝更新，并保持原 active world 不变

### Requirement: 世界设定 API
系统 SHALL 提供世界设定 API，用于读取、创建和更新 active world 或指定 `worldId` 的世界设定。

#### Scenario: 保存世界设定
- **GIVEN** 前端提交世界背景、规则、风格偏好、禁止事项和核心矛盾
- **WHEN** 后端保存设定
- **THEN** 系统 MUST 将设定持久化到指定 `worldId`，并返回规范化后的设定

#### Scenario: 读取缺失设定时回退
- **GIVEN** 指定世界尚未保存世界设定
- **WHEN** 前端读取该世界设定
- **THEN** 系统 MUST 返回由世界基础信息派生的可编辑设定或明确空状态，并且不得让页面渲染失败

### Requirement: 内容种子 API
系统 SHALL 提供内容种子 API，用于按 `worldId` 保存和读取角色、势力、地点和关系种子。

#### Scenario: 保存完整内容种子集合
- **GIVEN** 前端提交角色、势力、地点和关系种子集合
- **WHEN** 后端保存内容种子
- **THEN** 系统 MUST 在同一事务中更新该世界的内容种子，并返回规范化后的集合

#### Scenario: 读取内容种子统计
- **GIVEN** 指定世界存在角色、势力、地点或关系种子
- **WHEN** 前端读取世界状态快照
- **THEN** 系统 MUST 能提供用于工作台统计、活跃角色和紧张关系展示的数据

#### Scenario: 关系紧张度规范化
- **GIVEN** 前端提交缺失、非数字或超出范围的关系紧张度
- **WHEN** 后端保存关系种子
- **THEN** 系统 MUST 将紧张度规范化到可展示范围内，或返回可读校验错误

### Requirement: 世界运行状态 API
系统 SHALL 提供世界运行状态 API，用于读取运行状态、暂停或继续运行、推进一日、保存章节草稿和读取最近运行结果。

#### Scenario: 读取运行状态
- **GIVEN** 指定世界存在或尚未存在运行状态
- **WHEN** 前端请求该世界运行状态
- **THEN** 系统 MUST 返回包含当前世界时间、运行天数、暂停状态、章节草稿、最新章节和最近运行结果的可用状态

#### Scenario: 暂停或继续运行
- **GIVEN** 指定世界存在运行状态
- **WHEN** 前端请求切换暂停状态
- **THEN** 系统 MUST 保存新的暂停状态，并返回更新后的运行状态

#### Scenario: 推进一日
- **GIVEN** 指定世界存在运行状态
- **WHEN** 前端请求运行一天或推进一日
- **THEN** 系统 MUST 推进当前世界时间、增加运行天数、生成最近运行结果摘要，并持久化这些变化

#### Scenario: 推进一日不自动追加事件
- **GIVEN** 前端只请求推进一日且没有提交事件内容
- **WHEN** 后端保存运行结果
- **THEN** 系统 MUST NOT 自动向事件日志追加事件，MUST NOT 覆盖章节草稿或最新章节，MUST NOT 改写内容种子

### Requirement: 事件日志 API
系统 SHALL 提供事件日志 API，用于按世界读取、倒序排序和创建结构化事件事实。

#### Scenario: 读取世界事件列表
- **GIVEN** 指定世界存在多条事件
- **WHEN** 前端请求事件列表
- **THEN** 系统 MUST 只返回该 `worldId` 对应的可解析事件，并默认按最新创建或最新发生优先排序

#### Scenario: 创建结构化事件
- **GIVEN** 前端提交事件标题、摘要，并可选提交参与角色、地点、影响、详情、类型和重要性
- **WHEN** 后端创建事件
- **THEN** 系统 MUST 保存所有结构化事实字段、生成事件 ID 和创建时间，并返回新事件

#### Scenario: 拒绝空事件
- **GIVEN** 前端提交的事件标题或摘要为空
- **WHEN** 后端校验事件创建请求
- **THEN** 系统 MUST 拒绝保存，返回可读校验错误，并保持已有事件列表不变

### Requirement: 旧本地状态导入
系统 SHALL 提供旧浏览器本地状态导入能力，用于将已有 `localStorage` 世界库、设定、内容种子和运行记录迁移到后端。

#### Scenario: 导入旧世界状态
- **GIVEN** 前端检测到可解析的旧本地世界状态
- **WHEN** 前端调用导入接口
- **THEN** 系统 MUST 创建或合并对应世界、设定、内容种子、运行状态和事件，并返回旧 ID 到新 `worldId` 的映射

#### Scenario: 重复导入保持幂等
- **GIVEN** 同一旧本地世界状态已经导入过
- **WHEN** 前端再次调用导入接口
- **THEN** 系统 MUST 避免产生不可控重复世界，并返回稳定的导入结果

#### Scenario: 导入部分损坏数据
- **GIVEN** 旧本地状态中部分设定、种子或运行记录无法解析
- **WHEN** 后端执行导入
- **THEN** 系统 MUST 导入可解析部分，报告被跳过的数据类型，并且不得让整个服务崩溃

### Requirement: 非 Agent 首版边界
系统 SHALL 将本变更限制为世界状态后端和规则化运行摘要，不得触发 LangGraph、LLM 或多 Agent 工作流。

#### Scenario: 状态读写不触发 Agent
- **GIVEN** 用户创建世界、保存设定、保存种子、记录事件、暂停运行或切换 active world
- **WHEN** 后端处理这些请求
- **THEN** 系统 MUST NOT 触发 LangGraph、角色行动、叙事生成、LLM 调用或其他 Agent 工作流

#### Scenario: 推进一日不触发 Agent
- **GIVEN** 用户请求运行一天或推进一日
- **WHEN** 后端生成最近运行结果摘要
- **THEN** 系统 MUST 使用规则化服务逻辑生成摘要，并且 MUST NOT 调用 LangGraph、LLM 或 Agent runner

### Requirement: 后端质量验证
系统 SHALL 提供可验证的后端实现结果，覆盖静态检查、数据库迁移和关键 API 行为。

#### Scenario: 后端测试通过
- **GIVEN** 后端实现完成且测试数据库可用
- **WHEN** 开发者运行后端测试命令
- **THEN** 系统 MUST 在无 pytest 失败和无 ruff 错误的情况下完成检查

#### Scenario: 前端类型检查通过
- **GIVEN** 前端已经接入世界状态 API client
- **WHEN** 开发者运行前端类型检查
- **THEN** 系统 MUST 在无 TypeScript 类型错误的情况下完成检查
