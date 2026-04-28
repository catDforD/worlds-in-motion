## 1. 世界库模型与迁移

- [x] 1.1 新增 `src/types/world-library.ts`，定义 `WorldRecord`、世界库 payload、active world ID 和迁移相关类型
- [x] 1.2 新增 `src/lib/world-library.ts`，实现 worldId 生成、世界库安全解析、默认状态、保存和订阅
- [x] 1.3 在世界库初始化中实现旧 `WORLD_CREATION_STORAGE_KEY`、世界设定、内容种子和运行记录的单世界数据迁移
- [x] 1.4 增加切换 active world 的工具函数，并拒绝或回退不存在的 `worldId`

## 2. 按世界隔离本地状态

- [x] 2.1 扩展 `src/lib/world-settings.ts` 和类型定义，让世界设定按 `worldId` 读取、保存、订阅和损坏回退
- [x] 2.2 扩展 `src/lib/world-seed-assets.ts` 和类型定义，让内容种子按 `worldId` 读取、保存、订阅和损坏回退
- [x] 2.3 扩展 `src/lib/world-runtime.ts` 和类型定义，让运行记录按 `worldId` 读取、保存、更新和损坏回退
- [x] 2.4 保留旧 payload 解析能力，仅用于迁移和兼容升级，不让新写入继续覆盖旧单例 key

## 3. 创建页与工作台集成

- [x] 3.1 更新创建世界流程：提交后创建世界记录，保存对应世界设定，将新 `worldId` 设为 active，并进入工作台
- [x] 3.2 在工作台读取 active world，并用 active `worldId` 加载世界设定、内容种子和运行记录
- [x] 3.3 增加世界库/当前世界切换 UI，切换后刷新顶部横幅、设定编辑、种子展示和运行记录展示
- [x] 3.4 确认创建第二个世界不会覆盖第一个世界的设定、内容种子或运行记录

## 4. 文档与规格清理

- [x] 4.1 更新 `README.md` 中本地持久化说明，描述世界库、active world 和按 `worldId` 隔离的本地状态
- [x] 4.2 更新 `openspec/specs/world-event-ledger/spec.md` 的 Purpose，移除 Purpose TBD
- [x] 4.3 更新 `openspec/specs/world-creation-entry/spec.md` 的 Purpose，移除 Purpose TBD

## 5. 验证

- [x] 5.1 补充本地状态单元测试或等价覆盖，验证世界库解析、active world 切换、旧数据迁移和损坏回退
- [x] 5.2 补充多世界隔离测试，验证两个世界的设定、内容种子和运行记录互不覆盖
- [x] 5.3 运行项目静态检查或类型检查，确认无 TypeScript 和 lint 错误
- [x] 5.4 手动验证创建两个世界、切换世界、刷新恢复和旧单世界数据迁移路径
