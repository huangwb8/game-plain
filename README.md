# game-plain

基于 Web 技术的小游戏，提供有趣的游戏体验

## 特性

- HTML5 Canvas 渲染
- Vite 构建，快速热更新
- 原生 JavaScript（ESM）实现的“打飞机”纵向卷轴射击小游戏

## 操作方式

- 移动：←→ 或 A / D
- 射击：Space 或 Z

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm / npm / yarn

### 安装

```bash
# 安装依赖
npm install
```

### 开发

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 目录结构

```
game-plain/
├── src/                    # 源代码目录
│   ├── main.js            # 游戏入口、主循环、状态管理
│   ├── player.js          # 玩家飞机
│   ├── enemy.js           # 敌机系统（普通/精英）
│   ├── bullet.js          # 子弹对象池
│   └── ui.js              # UI 渲染（得分/生命/关卡/结束画面）
├── public/                # 公共资源
├── index.html             # 入口 HTML
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
└── vite.config.ts         # Vite 配置
```

## 游戏架构

本游戏采用单 Canvas 渲染，`requestAnimationFrame` 驱动主循环，模块按实体职责拆分：

- `src/main.js`：主循环、状态（分数/生命/关卡）、碰撞检测（AABB）
- `src/player.js`：玩家移动与射击
- `src/bullet.js`：子弹对象池（减少频繁创建/销毁）
- `src/enemy.js`：敌机生成与移动（普通/精英）
- `src/ui.js`：UI 渲染（分数/生命/关卡/结束画面）

## AI 辅助开发

本项目配置了 AI 辅助开发支持，可以使用以下工具进行智能开发：

### Claude Code

使用 `CLAUDE.md` 作为项目指令。

```bash
# 在项目目录启动 Claude Code
claude

# Claude Code 会自动读取 CLAUDE.md 理解项目上下文
```

### OpenAI Codex CLI

使用 `AGENTS.md` 作为项目指令。

```bash
# 在项目目录启动 Codex CLI
codex

# Codex 会自动读取 AGENTS.md 理解项目上下文
```

### AI 开发最佳实践

1. **新功能开发**：描述需求，AI 会按照项目工作流进行开发
2. **游戏逻辑优化**：请求 AI 优化游戏性能或逻辑
3. **Bug 修复**：描述问题现象，AI 会分析并给出解决方案
4. **代码审查**：请求 AI 审查代码，它会按照工程原则给出建议
5. **变更记录**：**重要** - 凡是项目的更新，都要统一在 `CHANGELOG.md` 文件里记录

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT License
