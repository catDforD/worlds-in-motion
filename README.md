# 织世录 Worlds in Motion

织世录是一个多智能体叙事沙盘的前端原型，用来创建、查看和维护持续运行的虚构世界。当前版本包含水墨风工作台、新建世界流程、世界库切换，以及可在浏览器本地保存的世界设定、内容种子和运行记录。

## 功能概览

- 工作台首页：展示世界概览、运行状态、近期事件、最新章节、活跃角色、紧张关系、秘密和趋势。
- 新建世界：通过 `/worlds/new` 填写世界名称、类型、背景、规则、叙事风格和初始冲突。
- 世界设定编辑：在首页点击“世界设定”，编辑 active world 的世界背景、规则、风格偏好、禁止事项和核心矛盾。
- 世界库与切换：创建页会新增本地世界记录并设为 active world；工作台顶部可切换已有世界。
- 本地持久化：`localStorage` 保存 `worlds-in-motion.world-library.v1` 世界库、active world ID，以及按 `worldId` 隔离的世界设定、内容种子和运行记录；刷新后恢复当前世界，不同世界互不覆盖。
- 纯前端原型：当前不会发起后端请求，也不会触发数据库写入或 Agent 运行。

## 技术栈

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- npm

## 快速开始

```bash
git clone git@github.com:catDforD/worlds-in-motion.git
cd worlds-in-motion
npm install
npm run dev
```

开发服务器默认使用 `http://localhost:3000`。如果端口被占用，Next.js 会自动切换到下一个可用端口。

## 使用示例

### 1. 创建一个新世界

1. 打开 `http://localhost:3000/worlds/new`。
2. 填写“世界名称”，例如 `雾隐十三州`。
3. 选择世界类型，例如“宫廷权谋”；也可以选择“自定义”并输入自己的类型名称。
4. 填写背景、叙事风格、世界规则和初始冲突。
5. 点击“创建世界”，页面会回到工作台首页。

提交成功后，首页顶部横幅会显示新世界名称、背景描述和标签；对应世界记录会成为 active world，设定会按新 `worldId` 写入浏览器本地存储。

### 2. 编辑世界设定

1. 打开首页 `http://localhost:3000/`。
2. 点击顶部横幅右侧的“世界设定”。
3. 修改世界背景、世界规则、风格偏好、禁止事项或核心矛盾。
4. 点击“保存设定”。

保存后，首页顶部的世界描述和标签会立即更新；世界规则、禁止事项和核心矛盾只作为当前 `worldId` 的设定底稿保存，不会自动改写事件、角色关系、秘密或趋势模块。

### 3. 切换多个世界

1. 至少创建两个世界。
2. 回到首页顶部横幅，在“当前世界”下拉菜单中选择另一个世界。
3. 确认顶部横幅、设定编辑、内容种子展示和运行记录展示切换到所选世界。

### 4. 验证本地恢复

1. 创建或编辑一个世界。
2. 刷新首页，确认 active world、世界名称、背景、标签、内容种子和运行记录仍然保留。
3. 如需重置演示数据，可在浏览器开发者工具中清除本站的 `localStorage`。

## 常用命令

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

## 页面入口

- `/`：水墨风世界工作台
- `/worlds/new`：新建世界表单

## 目录结构

```text
src/
  app/            Next.js App Router 入口
  components/     共享组件
  components/ui/  shadcn/ui 组件
  lib/            工具函数
  types/          共享类型目录
public/
  dashbord/       工作台图片素材
openspec/
  changes/        OpenSpec 变更记录
  specs/          OpenSpec 主规格
```

## 开发备注

- 工作台默认数据位于 `src/lib/dashboard-data.ts`。
- 新建世界相关类型和选项位于 `src/types/world-creation.ts` 与 `src/lib/world-creation.ts`。
- 世界库、active world 和旧单世界数据迁移逻辑位于 `src/lib/world-library.ts`。
- 世界设定、内容种子和运行记录的按 `worldId` 读写逻辑分别位于 `src/lib/world-settings.ts`、`src/lib/world-seed-assets.ts` 和 `src/lib/world-runtime.ts`。
- 世界设定编辑器集成在 `src/components/dashboard/ink-dashboard.tsx`。

## 回滚

如需回滚本次前端工程初始化，删除新增的前端工程文件、依赖清单、构建产物和 `src/`、`public/`、`node_modules/` 目录；如果已有提交，优先使用 `git revert` 回滚对应提交。
