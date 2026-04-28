## Context

当前前端已经有三个本地状态模块：`src/lib/world-settings.ts`、`src/lib/world-seed-assets.ts`、`src/lib/world-runtime.ts`。它们都使用版本化 `localStorage` key、安全 JSON 解析、损坏回退和自定义事件订阅，但存储语义仍是“当前世界全局单例”。创建流程还通过 `WORLD_CREATION_STORAGE_KEY` 记录最近创建的世界，导致再次创建会覆盖工作台上下文。

这个 change 横跨创建页、工作台、三个本地状态模块、类型定义和文档。首版仍限制在前端本地，不引入 FastAPI、PostgreSQL 或 Agent 运行。

受影响文件和模块：
- `src/types/world-library.ts`：新增世界记录、世界库 payload 和迁移类型。
- `src/lib/world-library.ts`：新增 worldId 生成、世界库读取、保存、订阅、active world 切换和旧数据迁移。
- `src/lib/world-settings.ts`、`src/lib/world-seed-assets.ts`、`src/lib/world-runtime.ts`：改为按 `worldId` 读写，同时保留旧 payload 解析用于迁移。
- `src/lib/world-creation.ts`：创建表单到世界记录、世界设定的映射继续复用，但创建动作不再直接覆盖单例状态。
- `src/components/world-creation/create-world-page.tsx`：创建世界库记录并激活新世界。
- `src/components/dashboard/ink-dashboard.tsx`：从 active world 读取世界信息、设定、种子和运行记录，并支持切换后重新渲染。
- `README.md`、`openspec/specs/world-event-ledger/spec.md`、`openspec/specs/world-creation-entry/spec.md`：更新本地状态和 Purpose 描述。

## Goals / Non-Goals

**Goals:**
- 提供本地世界库，支持多个世界记录和 active world ID。
- 让世界设定、内容种子、运行记录全部按 `worldId` 隔离。
- 创建新世界时新增世界记录并设为 active，不覆盖已有世界。
- 首次升级时将旧单世界 localStorage 数据迁移到一个默认世界。
- 保持现有纯前端、本地保存、损坏数据回退和同页订阅更新模式。
- 更新 README 和残留 Purpose TBD，让文档反映当前能力。

**Non-Goals:**
- 不实现后端世界模型、数据库迁移、登录用户隔离或跨设备同步。
- 不启动 LangGraph、角色行动或叙事生成。
- 不实现复杂世界归档、删除确认流、导入导出或搜索筛选。
- 不改变当前 shadcn/ui 和 Tailwind 的前端基础技术栈。

## Decisions

1. 新增 `world-library` 本地模块作为 active world 的权威来源。
   - 方案：使用 `worlds-in-motion.world-library.v1` 保存 `{ version, activeWorldId, worlds }`，每个 `WorldRecord` 至少包含 `id`、`name`、`type`、`description`、`tags`、`createdAt`、`updatedAt`。
   - 理由：active world 不应散落在每个模块里，否则切换世界时容易出现设定和运行记录不同步。
   - 替代方案：继续只用创建临时状态推导当前世界。缺点是无法表达多个世界，也没有稳定 ID。

2. `worldId` 使用客户端生成的稳定字符串。
   - 方案：优先使用 `crypto.randomUUID()`，回退到时间戳和随机串；统一前缀如 `world-...`。
   - 理由：首版没有后端 ID 来源，但仍需要可持久化、可作为映射 key 的 ID。
   - 替代方案：使用世界名称作为 ID。缺点是重名、改名和空名称都会破坏隔离。

3. 三个本地状态模块改为 scoped payload。
   - 方案：新 payload 形态使用 `{ version: 2, byWorldId: Record<string, T> }` 或等价结构，公共函数接收 `worldId`，例如 `getStoredWorldSettings(worldId)`、`saveWorldSettings(worldId, settings)`、`subscribeToWorldSettings(worldId, callback)`。
   - 理由：一个 key 存一类状态可以延续现有订阅和解析模式，按 worldId 映射避免大量 localStorage key。
   - 替代方案：每个世界每类状态一个 key，例如 `world-settings.<worldId>`。优点是局部写入小，缺点是订阅、清理、迁移和调试更分散。

4. 旧数据迁移由世界库读取路径协调。
   - 方案：首次读取世界库时，如果没有 v1 世界库，则从旧 `WORLD_CREATION_STORAGE_KEY`、`world-settings.v1`、`world-seed-assets.v1`、`world-runtime-state.v1` 读取可解析数据，创建一个迁移世界并写入新 scoped payload；随后保留旧 key 但新代码优先读新结构。
   - 理由：迁移需要同时知道世界记录和各类状态，集中在世界库初始化更容易保证 active world 一致。
   - 替代方案：每个模块自行迁移。缺点是可能创建多个不同默认 worldId，导致旧数据被拆散。

5. 创建流程写入世界库而不是直接覆盖当前单例。
   - 方案：用户点击创建世界后，基于表单创建 `WorldRecord`，保存对应 `WorldSettings`，将新 ID 设为 active，再导航到工作台。
   - 理由：新世界应成为当前世界，但旧世界记录和 scoped 状态必须保留。
   - 替代方案：创建后只保存 active form。缺点是与多世界目标相冲突。

6. 文档修复纳入同一 change。
   - 方案：README 更新本地持久化说明；两个已有 spec 的 Purpose TBD 改成实际用途说明。
   - 理由：这些文档直接描述本地世界能力边界，继续保留 TBD 会让后续实现和归档含混。

## Risks / Trade-offs

- [Risk] 旧 localStorage 数据可能损坏或字段缺失 → Mitigation：继续复用各模块安全解析；迁移失败时创建可读默认世界，不阻断页面渲染。
- [Risk] 多模块迁移期间可能出现 worldId 不一致 → Mitigation：迁移只由 `world-library` 生成一次 worldId，并把该 ID 传给设定、种子和运行记录迁移写入。
- [Risk] 单 key 的 `byWorldId` payload 随世界数量增长变大 → Mitigation：首版只保存文本和少量列表；后续后端或 IndexedDB 迁移前保持本地世界数量预期较小。
- [Risk] localStorage 可被同源脚本读取 → Mitigation：不保存凭据和敏感 token，不执行用户输入，继续依赖 React 默认转义展示文本。
- [Risk] 同页订阅和跨 tab storage 事件容易漏 worldId → Mitigation：自定义事件携带或统一广播后由订阅方重新读取 active world；storage 事件监听新旧相关 key。
- [Risk] 旧函数签名变更影响组件调用 → Mitigation：以 TypeScript 编译暴露遗漏点，并在必要时提供兼容 helper，把默认 active world 的获取集中在组件边界。

## Migration Plan

1. 新增世界库类型和 `src/lib/world-library.ts`，实现读取、保存、订阅、active world 切换和默认世界创建。
2. 扩展设定、内容种子和运行记录模块，支持 scoped payload，同时保留旧解析函数给迁移使用。
3. 在世界库初始化时执行一次旧数据迁移，写入新世界库和 scoped 状态。
4. 更新创建页：创建世界记录、保存该世界设定、设为 active、进入工作台。
5. 更新工作台：读取 active world，并用 active `worldId` 获取设定、种子和运行记录；切换 world 后刷新派生展示。
6. 更新 README 和 Purpose TBD specs。
7. 补充或调整测试，覆盖创建两个世界后状态隔离、旧数据迁移和损坏回退。

回滚策略：恢复创建页和工作台对旧单例 storage key 的读取，停止读取 `world-library.v1` 和 scoped payload；已写入的新世界库数据留在浏览器中但不参与渲染，不会影响旧单例路径加载。

## Open Questions

- 世界库首版是否需要删除世界入口？本 change 暂不实现删除，以降低误删本地数据的风险。
- 世界切换 UI 放在侧栏还是顶部横幅？实现时可按现有布局选择最小清晰入口，但必须能切换 active world。
