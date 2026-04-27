## Why

织世录需要先建立稳定的前端工程底座，才能承载后续的世界设定录入、沙盘运行视图、日志整理与叙事生成界面。当前仓库尚未初始化可运行的前端应用，先完成 Next.js、TypeScript、Tailwind CSS 与 shadcn/ui 的基础工程配置，可以减少后续功能开发中的重复决策和集成风险。

## What Changes

- 创建一个可正常启动的 Next.js 前端项目。
- 启用 TypeScript，并采用项目约定的 TypeScript 命名规范。
- 配置 Tailwind CSS，作为后续界面样式系统基础。
- 安装并初始化 shadcn/ui，建立后续组件扩展所需的配置。
- 建立基础目录结构，用于承载页面、组件、工具函数、类型和样式。
- 提供最小可运行空项目页面，验证工程链路正常。
- 不引入后端、数据库、Agent 编排或真实业务流程。

## Capabilities

### New Capabilities
- `frontend-foundation`: 定义前端基础工程的初始化要求，包括 Next.js、TypeScript、Tailwind CSS、shadcn/ui、目录结构和空项目运行验证。

### Modified Capabilities
- 无。

## Impact

- 受影响代码：仓库根目录前端工程文件、Next.js 应用目录、Tailwind 配置、shadcn/ui 配置、基础组件和工具目录。
- 受影响依赖：新增 Node.js 前端依赖，包括 Next.js、React、TypeScript、Tailwind CSS、shadcn/ui 及其必要运行依赖。
- 受影响系统：仅影响前端工程初始化；不改变公共 API、不接入后端服务、不修改数据模型。
- 对现有功能的影响：当前无既有应用功能，预期不会造成行为回归；后续功能开发将基于该工程底座继续演进。
- 回滚计划：如初始化方案不可用，可删除新增前端工程文件、依赖清单、配置文件和应用目录，回到仅包含 OpenSpec 文档的仓库状态；若已提交，可通过一次 revert 回滚该工程初始化提交。
- 需要协调的团队：前端开发确认目录与组件约定，产品/叙事设计确认首屏空项目不承载业务流程，后端/Agent 开发确认本阶段不要求 API 集成。
