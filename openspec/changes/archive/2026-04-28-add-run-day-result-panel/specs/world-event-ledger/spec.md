## MODIFIED Requirements

### Requirement: 手动推进一日
系统 SHALL 提供轻量手动入口，允许用户将本地世界时间推进一日、增加运行天数，并保存最近一次运行结果摘要。

#### Scenario: 推进一日
- **GIVEN** 工作台已加载本地世界运行记录
- **WHEN** 用户执行“运行一天”或兼容的“推进一日”操作
- **THEN** 系统 MUST 将当前世界时间推进到下一日，将运行天数增加 1，并生成最近一次运行结果摘要

#### Scenario: 推进一日后持久化
- **GIVEN** 用户已经执行“运行一天”或兼容的“推进一日”操作
- **WHEN** 页面重新加载
- **THEN** 系统 MUST 显示推进后的当前世界时间、运行天数和最近一次运行结果摘要

#### Scenario: 推进一日不自动写入事件日志
- **GIVEN** 用户只执行“运行一天”或兼容的“推进一日”操作且没有填写事件内容
- **WHEN** 系统保存运行记录
- **THEN** 系统 MUST NOT 向 `WorldRuntimeState.events` 自动追加事件，MUST NOT 覆盖 `chapterDraft` 或 `latestChapter`，并且 MUST NOT 改写角色、关系或世界种子记录

## ADDED Requirements

### Requirement: 最近运行结果摘要
系统 SHALL 在 `WorldRuntimeState` 中维护最近一次运行结果摘要，用于记录本轮运行的统计、明细、发生日期、运行天数和生成时间。

#### Scenario: 保存最近运行结果摘要
- **GIVEN** 用户执行“运行一天”
- **WHEN** 系统保存本地世界运行记录
- **THEN** 系统 MUST 在 active `worldId` 对应的 `WorldRuntimeState.lastRunResult` 中保存本轮事件数、关系变化数、秘密发现数、角色目标改变数、故事草稿生成数、分类明细、发生日期、运行天数和生成时间

#### Scenario: 运行结果统计为非负数
- **GIVEN** 系统解析或生成最近运行结果摘要
- **WHEN** 结果摘要包含任一统计字段
- **THEN** 系统 MUST 将统计字段规范化为非负整数，并为缺失统计使用 0

#### Scenario: 运行结果明细可选
- **GIVEN** 最近运行结果摘要缺少某个分类的明细
- **WHEN** 系统解析该摘要
- **THEN** 系统 MUST 使用空明细列表回退，并保留该分类的统计值

#### Scenario: 旧运行记录兼容
- **GIVEN** 本地运行记录缺少 `lastRunResult`
- **WHEN** 系统解析 `WorldRuntimeState`
- **THEN** 系统 MUST 将最近运行结果解析为 `null`，并继续恢复当前世界时间、运行天数、暂停状态、事件列表、章节草稿和最新章节

#### Scenario: 损坏运行结果回退
- **GIVEN** 本地运行记录中的 `lastRunResult` 字段无法解析或缺少必要结构
- **WHEN** 系统读取 `WorldRuntimeState`
- **THEN** 系统 MUST 丢弃损坏的最近运行结果并使用 `null` 回退，且 MUST NOT 让工作台或事件日志页面渲染失败

#### Scenario: 最近运行结果按世界隔离
- **GIVEN** 两个 active world 分别保存了不同的最近运行结果
- **WHEN** 用户切换 active world
- **THEN** 系统 MUST 只读取切换后 `worldId` 对应的最近运行结果

#### Scenario: 运行结果不触发 Agent
- **GIVEN** 用户执行“运行一天”并生成最近运行结果摘要
- **WHEN** 系统保存运行记录
- **THEN** 系统 MUST NOT 触发 LangGraph、角色行动、叙事生成或其他 Agent 工作流
