## 1. 本地运行结果数据契约

- [x] 1.1 在 `src/types/world-runtime.ts` 中新增 `WorldRuntimeRunResult`、五类统计和分类明细类型，并将 `lastRunResult` 加入 `WorldRuntimeState`
- [x] 1.2 更新 `defaultWorldRuntimeState`，为最近运行结果提供 `null` 默认值
- [x] 1.3 在 `src/lib/world-runtime.ts` 中新增最近运行结果解析与 normalize 逻辑，确保旧记录、缺失字段和损坏字段安全回退
- [x] 1.4 保持 localStorage 外层版本兼容，确认旧 `version: 2` 数据读取后不会丢失已有事件、章节、暂停状态和运行天数

## 2. 运行一天逻辑

- [x] 2.1 新增或改造“运行一天” helper，统一推进日期、增加运行天数并生成 `lastRunResult`
- [x] 2.2 为五类结果生成非负统计和可读明细，优先基于现有事件、角色种子、关系种子和默认工作台数据派生
- [x] 2.3 确保“运行一天”不会自动追加 `events`、覆盖 `chapterDraft` 或 `latestChapter`，也不会改写角色、关系或世界种子
- [x] 2.4 更新 `InkDashboard` 的运行处理函数，使用新的 helper 保存 active world 对应的本地运行记录

## 3. 侧边栏结果面板 UI

- [x] 3.1 将运行按钮文案从“推进一日”调整为“运行一天”，并保持暂停/继续运行逻辑不变
- [x] 3.2 新增结果面板组件，在右侧信息栏当前时间模块下方展示最近一次运行结果
- [x] 3.3 实现无结果空状态、五类统计文案和分类明细展示，长文本需要截断或换行且不得撑破布局
- [x] 3.4 更新右侧信息栏传参与派生数据，使刷新页面和切换 active world 后显示对应世界的最近运行结果
- [x] 3.5 补充 `src/app/globals.css` 样式，覆盖桌面右侧栏和窄屏纵向布局

## 4. 验证

- [x] 4.1 运行 TypeScript 与 lint 检查，确认新增类型、helper 和组件无静态错误
- [x] 4.2 使用浏览器或 Playwright 验证点击“运行一天”后日期、运行天数和结果面板同步更新
- [x] 4.3 验证刷新页面后最近运行结果恢复，切换 active world 后只展示对应世界结果
- [x] 4.4 验证旧本地运行记录、缺失 `lastRunResult` 和损坏结果字段不会导致工作台或事件日志页面渲染失败
- [x] 4.5 验证桌面和窄屏截图中结果面板可读，按钮、统计、明细和相邻模块没有明显遮挡或横向溢出
