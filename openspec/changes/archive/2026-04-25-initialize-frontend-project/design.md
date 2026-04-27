## Context

织世录当前处于前端工程初始化阶段，仓库内尚未存在可运行的 Web 应用。该阶段的目标是建立一个最小但完整的 Next.js 工程，让后续世界背景录入、角色关系编辑、沙盘运行日志和叙事整理界面可以在一致的技术基础上开发。

本设计受以下约束影响：前端技术栈固定为 Next.js、TypeScript、Tailwind CSS 和 shadcn/ui；本阶段不接入 FastAPI、PostgreSQL、pgvector 或 LangGraph；所有公共 API 需保持向后兼容，但当前没有既有 API 需要迁移。

受影响的文件和模块包括：`package.json`、依赖锁文件、`next.config.*`、`tsconfig.json`、`tailwind.config.*`、`postcss.config.*`、`components.json`、`src/app/**`、`src/components/**`、`src/lib/**`、`src/types/**` 和 `src/styles/**`。

## Goals / Non-Goals

**Goals:**

- 初始化可运行的 Next.js 前端项目。
- 配置 TypeScript，确保项目可以执行类型检查。
- 配置 Tailwind CSS，提供全局样式入口和设计 token 基础。
- 初始化 shadcn/ui，建立组件生成和样式约定。
- 建立基础目录结构，支持后续页面、组件、工具函数和类型扩展。
- 提供一个最小首页，用于验证应用能正常启动和渲染。

**Non-Goals:**

- 不实现世界创建、人物管理、关系图、时间推进或叙事生成业务功能。
- 不接入后端 API、数据库、认证、LLM 或 Agent 工作流。
- 不设计完整视觉系统或生产级首页。
- 不创建复杂状态管理、数据请求层或业务规则引擎。

## Decisions

1. 使用 Next.js App Router 作为应用结构。

   理由：App Router 是当前 Next.js 的主流结构，适合后续逐步扩展页面、布局和服务端组件。备选方案是 Pages Router，但它对新项目的长期演进价值较低，也不符合 Next.js 新项目的默认方向。

2. 使用 `src/` 目录承载应用源码。

   理由：`src/app`、`src/components`、`src/lib` 和 `src/types` 能把源码与根目录配置文件清晰分离。备选方案是根目录 `app/`，虽然更简单，但随着后续前后端配置和工具脚本增加，根目录会更快变得拥挤。

3. 使用 Tailwind CSS 作为基础样式层，并保留 shadcn/ui 默认所需的 CSS 变量。

   理由：Tailwind 与 shadcn/ui 配合成熟，可以快速构建一致的组件界面。备选方案是 CSS Modules 或纯 CSS，但会降低 shadcn/ui 的集成效率，并增加后续组件样式维护成本。

4. 初始化 shadcn/ui 配置，但只保留最小组件基础。

   理由：本阶段目标是工程可用，不是批量引入 UI 组件。先建立 `components.json`、`src/lib/utils.ts` 和组件目录，后续按功能需要再添加具体组件，可以减少无用代码。备选方案是一次性生成大量组件，但会扩大初始维护面。

5. 暂不引入业务状态管理和 API 客户端。

   理由：当前没有稳定的业务接口契约，过早抽象会制造无效结构。等世界设定、沙盘运行和日志整理能力进入规格阶段后，再基于真实需求设计数据层。

## Risks / Trade-offs

- [Risk] Next.js、Tailwind CSS 或 shadcn/ui 版本组合不兼容 → Mitigation：使用官方脚手架和 shadcn/ui 初始化命令生成配置，并通过本地启动、构建或 lint 验证。
- [Risk] 初始目录结构过度设计 → Mitigation：只创建后续明确需要的基础目录，不添加业务模块或复杂抽象。
- [Risk] 空项目页面被误认为业务首页设计 → Mitigation：页面仅承担运行验证，不包含世界沙盘业务流程。
- [Risk] Tailwind 全局样式影响后续视觉系统 → Mitigation：保留 shadcn/ui 标准变量和基础层，后续设计系统再通过规格化变更调整。
- [Risk] 新增前端依赖扩大供应链风险 → Mitigation：只安装必要依赖，提交锁文件，并避免引入未经使用的第三方库。

## Migration Plan

1. 在仓库根目录初始化 Next.js + TypeScript 项目。
2. 安装并配置 Tailwind CSS。
3. 初始化 shadcn/ui，并确认别名、全局样式和组件目录可用。
4. 创建基础目录结构和最小首页。
5. 运行依赖安装、类型检查、lint 或构建验证工程可运行。

回滚策略：删除本次新增的前端工程文件、源码目录、依赖清单、锁文件和 shadcn/ui 配置；如本次变更已提交，则通过 revert 回滚初始化提交。

## Open Questions

- 包管理器默认使用 npm、pnpm 还是 yarn？若仓库没有既有约定，实施阶段可优先采用脚手架默认或当前环境最稳定的选择。
- 是否需要在第一阶段加入 Playwright 基础配置？当前目标是空项目可运行，因此可延后到首个可交互页面出现时再添加。
