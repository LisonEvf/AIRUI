# AIRUI Claude Code Plugin 设计文档

**日期**：2026-06-04
**状态**：已批准

---

## 1. 概述

基于 AIRUI 项目构建一个 Claude Code MCP 插件，核心目标是改变用户对 AI 交互的认知——从纯文本对话，进化为"终端聊天 + 浏览器可视化看板"的双窗口协作模式。

Claude 不再只用文字回答数据问题，而是直接生成可交互的可视化看板。用户在浏览器中的操作（点击、钻取、筛选）实时回传给 Claude，Claude 推理后通过增量 patch 更新看板，形成闭环。

### 核心决策

| 决策项 | 选择 |
|--------|------|
| 插件形态 | MCP Server + 浏览器看板（双窗口协作） |
| 场景定位 | 通用可视化（不绑定金融场景） |
| 触发方式 | 自动/手动混合（可 `/viz off` 关闭） |
| 交互深度 | 深度交互（WebSocket 回传 → Claude 推理 → patch 更新） |
| 技术栈 | TypeScript + Node |
| 仓库 | 独立仓库，npm 依赖 @air-ui/core 和 @air-ui/renderer-react |
| 分发 | 先源码安装，稳定后发 npm |
| 架构方案 | 单进程 MCP Server + 内嵌静态 SPA |

---

## 2. 核心架构

### 2.1 进程模型

```
┌─────────────────────────────────────────────────────────┐
│              airui-claude-plugin (单进程)                 │
│                                                         │
│  ┌──────────────────┐    stdio     ┌──────────────────┐ │
│  │   MCP Server     │◄──────────►│   Claude Code     │ │
│  │   (tools +       │             │                   │ │
│  │    session mgr)  │             │  airui_render     │ │
│  │                  │             │  airui_patch      │ │
│  └───────┬──────────┘             │  airui_event      │ │
│          │                        └──────────────────┘ │
│  ┌───────▼──────────┐                                 │
│  │  HTTP + WS Server│    WebSocket                    │
│  │  (port: auto)    │◄──────────►  浏览器 SPA          │
│  │                  │             (看板渲染 + 交互)      │
│  │  /ws   → 双向通信  │                                 │
│  │  /*    → 静态文件  │                                 │
│  └──────────────────┘                                 │
└─────────────────────────────────────────────────────────┘
```

### 2.2 启动流程

1. Claude Code 启动时，根据 MCP 配置 spawn `mcp-server` 进程（stdio transport）
2. `mcp-server` 初始化时启动 HTTP + WS 服务（自动选可用端口，默认从 `9527` 开始尝试）
3. 端口信息写入临时文件 `$TMPDIR/airui-plugin-port`
4. 浏览器不主动打开，等 Claude 第一次调用 `airui_render` 时才打开

### 2.3 会话模型

- 每次对话（一个 Claude Code session）对应一个 Dashboard Session
- Session 内维护一个 AIRUI 文档 + 事件队列
- Claude 调用 `airui_event` 时，MCP Server 从事件队列中取事件返回（阻塞等待，最多等 30s）
- 多个浏览器 tab 连到同一个 session，共享同一份文档状态

### 2.4 完整交互循环

```
1. Claude 调用 airui_render({ document: AirUIDocument })
   → MCP Server 存储 document → WS 推送给浏览器 → 浏览器渲染
   → 自动 open 浏览器 URL
   → tool result: "看板已渲染，等待用户交互..."

2. 用户在浏览器点击图表元素
   → 浏览器 WS 发送 { type: "interaction", widgetRef, interaction, payload }
   → MCP Server 将事件入队

3. Claude 调用 airui_event({ timeout: 30 })
   → MCP Server 从队列取事件返回
   → tool result: { widgetRef: "chart-1", interaction: "drilldown", payload: {...} }

4. Claude 推理后调用 airui_patch({ patches: Patch[] })
   → MCP Server 应用 patch → WS 推送给浏览器 → 浏览器增量更新
   → tool result: "Patch 已应用"
```

---

## 3. MCP Tools 接口

### 3.1 `airui_render` — 首次生成或完整替换看板

```typescript
// Input
{
  document: AirUIDocument;  // 完整的 AIRUI 文档
  open?: boolean;           // 是否自动打开浏览器，默认 true
  title?: string;           // 浏览器标签页标题
}

// Output
{
  status: "rendered";
  sessionId: string;
  url: string;
  message: string;
}
```

### 3.2 `airui_patch` — 增量更新看板

```typescript
// Input
{
  patches: Patch[];         // RFC 6902 子集 + update-state
}

// Output
{
  status: "patched";
  appliedCount: number;
  stateSnapshot: Record<string, unknown>;  // patch 后的 state 快照
}
```

### 3.3 `airui_event` — 等待用户交互事件（阻塞式）

```typescript
// Input
{
  timeout?: number;         // 等待超时秒数，默认 30，最大 120
  filter?: {                // 可选，只关注特定类型的事件
    widgetRef?: string;
    interaction?: string;
  };
}

// Output (有事件时)
{
  status: "event";
  events: [{
    widgetRef: string;
    interaction: "drilldown" | "filter" | "sort" | "select" | "hover" | "refresh";
    payload: Record<string, unknown>;
    timestamp: number;
  }];
}

// Output (超时)
{
  status: "timeout";
  message: "30s 内无用户交互";
}
```

### 3.4 自动触发规则

Claude 在以下场景主动调用 `airui_render`，无需用户显式请求：

| 场景 | 判断依据 |
|------|---------|
| 数据对比/趋势 | 回答中涉及数值对比、趋势描述 |
| 结构关系 | 用户问架构、依赖、层级关系 |
| 表格数据 > 5 行 | 需要展示较多行数据 |
| 用户明确要求 | "画出来"、"可视化"、"帮我看看" |

控制命令：
- `/viz off` — 关闭自动触发
- `/viz on` — 恢复自动触发
- `/viz` — 强制触发

实现方式：通过 tool description + system prompt 注入引导 Claude 何时调用。`/viz` 命令修改本地配置文件，MCP Server 读取配置决定是否在 tool description 中包含自动触发提示。

---

## 4. 浏览器 SPA 架构

### 4.1 页面布局

```
┌──────────────────────────────────────────────────────────┐
│  ● AirUI Dashboard                          [_] [□] [×]  │
├──────────┬───────────────────────────────────────────────┤
│          │                                               │
│  Events  │         主看板区域 (AIRUI Renderer)            │
│  Panel   │                                               │
│          │   ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  ┌──────┐│   │ Widget  │ │ Widget  │ │ Widget  │       │
│  │ drill││   │  KPI    │ │ Chart   │ │  Table  │       │
│  │ down ││   └─────────┘ └─────────┘ └─────────┘       │
│  │ ↓    ││                                               │
│  │ chart││   ┌───────────────────┐ ┌─────────┐          │
│  │  1   ││   │     Widget        │ │ Widget  │          │
│  └──────┘│   │   Chart(detail)   │ │  Table  │          │
│          │   └───────────────────┘ └─────────┘          │
│  状态:   │                                               │
│  ● 已连接│                                               │
├──────────┴───────────────────────────────────────────────┤
│  点击看板元素 → 事件回传 Claude → patch 更新                  │
└──────────────────────────────────────────────────────────┘
```

### 4.2 左侧 Events Panel

- **事件流**：实时显示用户操作历史（drilldown、filter、select 等），让用户知道操作已被 Claude 接收
- **连接状态**：WebSocket 连接状态（已连接/断开/重连中）
- **文档状态摘要**：state 的关键字段值

### 4.3 WebSocket 通信协议

```typescript
// Server → Browser
type ServerMessage =
  | { type: "document"; data: AirUIDocument; title?: string }
  | { type: "patch"; data: Patch[] }
  | { type: "status"; connected: boolean; sessionId: string };

// Browser → Server
type BrowserMessage =
  | { type: "interaction"; widgetRef: string; interaction: string; payload: Record<string, unknown> }
  | { type: "ready" };
```

### 4.4 技术选型

| 层 | 选型 | 理由 |
|----|------|------|
| 构建 | Vite | 与 AIRUI playground 一致 |
| UI | React 19 | 复用 renderer-react |
| 状态 | Zustand | 复用 store 设计 |
| 图表 | ECharts（轻量引入） | Chart 组件的数据渲染 |
| WebSocket | 原生 WebSocket API | 无需额外依赖 |

### 4.5 构建产物内嵌

`web-dashboard` 构建后输出 `dist/`，`mcp-server` 的 HTTP 静态服务直接 serve 这个 `dist/`。发布时 `dist/` 打包进 npm 包。

---

## 5. MCP Server 内部模块

### 5.1 模块结构

```
packages/mcp-server/src/
├── index.ts            # 入口：创建 MCP Server，注册 tools，启动 HTTP+WS
├── tools/
│   ├── render.ts       # airui_render 实现
│   ├── patch.ts        # airui_patch 实现
│   └── event.ts        # airui_event 实现
├── session.ts          # DashboardSession：文档状态 + 事件队列
├── ws-bridge.ts        # WebSocket 服务端
├── http-server.ts      # HTTP 静态文件服务
└── trigger-rules.ts    # 自动触发规则
```

### 5.2 Session 管理器

```typescript
class DashboardSession {
  sessionId: string;
  document: AirUIDocument | null;
  eventQueue: BrowserEvent[];
  eventWaiters: ((events: BrowserEvent[]) => void)[];

  updateDocument(doc: AirUIDocument): void;
  enqueueEvent(event: BrowserEvent): void;
  waitForEvent(timeout: number): Promise<BrowserEvent[]>;
}
```

`airui_event` 阻塞式等待：无事件时挂起请求，直到浏览器交互到来或超时。

### 5.3 WS Bridge

```typescript
class WSBridge {
  wss: WebSocket.Server;
  session: DashboardSession;

  start(port: number): void;
  pushDocument(doc: AirUIDocument, title?: string): void;
  pushPatch(patches: Patch[]): void;
}
```

职责：
- 监听 Session 变化，推送给浏览器
- 接收浏览器消息，写入 Session 事件队列

---

## 6. 仓库结构

```
airui-claude-plugin/
├── packages/
│   ├── mcp-server/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── tools/
│   │   │   │   ├── render.ts
│   │   │   │   ├── patch.ts
│   │   │   │   └── event.ts
│   │   │   ├── session.ts
│   │   │   ├── ws-bridge.ts
│   │   │   ├── http-server.ts
│   │   │   └── trigger-rules.ts
│   │   ├── package.json             # @airui/mcp-server
│   │   └── tsconfig.json
│   │
│   └── web-dashboard/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── ws-client.ts
│       │   ├── components/
│       │   │   ├── EventPanel.tsx
│       │   │   ├── StatusBar.tsx
│       │   │   └── DashboardView.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── vite.config.ts
│       ├── package.json             # @airui/web-dashboard
│       └── tsconfig.json
│
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── README.md
```

### 包依赖关系

```
@airui/mcp-server
  ├── @air-ui/core          (npm 依赖)
  ├── @airui/web-dashboard  (workspace 引用，构建产物内嵌)
  └── ws, express           (运行时依赖)

@airui/web-dashboard
  ├── @air-ui/core                    (npm 依赖)
  ├── @air-ui/renderer-react          (npm 依赖)
  ├── echarts                         (图表)
  └── react, zustand                  (UI 层)
```

### 构建流程

```
1. web-dashboard → vite build → dist/
2. mcp-server → tsc → dist/ + 复制 web-dashboard/dist/ 到 static/
```

### 安装配置

```json
// 源码安装
{
  "mcpServers": {
    "airui": {
      "command": "node",
      "args": ["/path/to/airui-claude-plugin/packages/mcp-server/dist/index.js"]
    }
  }
}

// npm 安装（后期）
{
  "mcpServers": {
    "airui": {
      "command": "npx",
      "args": ["-y", "@airui/mcp-server"]
    }
  }
}
```

---

## 7. 错误处理

### 7.1 连接异常

| 场景 | 处理 |
|------|------|
| 浏览器未打开 | `airui_render` 正常推送到 WS，记录 `url`，Claude 可文字提示 |
| 浏览器连接后断开 | 看板区域显示"连接断开，正在重连..."，自动重连（最多 5 次，间隔 3s） |
| 浏览器重连成功 | 自动补发当前完整文档 |
| MCP Server 进程被杀 | 浏览器检测 WS 关闭，显示"服务已停止" |

### 7.2 数据异常

| 场景 | 处理 |
|------|------|
| AIRUI 文档 schema 不合法 | 返回 `{ status: "error", message: "..." }` + 校验失败字段 |
| Patch 路径不存在 | 忽略该 patch，tool result 中 warn |
| state 引用解析失败 | 渲染为 `undefined` 占位符，不崩溃 |

### 7.3 超时与阻塞

| 场景 | 处理 |
|------|------|
| `airui_event` 等待中用户关闭浏览器 | 超时后返回 `{ status: "timeout" }` |
| `airui_event` timeout 设为 0 | 立即返回已有事件，无事件返回空数组 |
| Claude 连续调用 `airui_render` | 新文档覆盖旧文档，事件队列清空 |
| 交互在 Claude 未调用 `airui_event` 时发生 | 事件入队积累，下次调用一次性返回 |

### 7.4 并发与端口

| 场景 | 处理 |
|------|------|
| 端口 9527 被占用 | 自动尝试 9528、9529... |
| 多个 Claude Code session | 每个进程独立端口、独立 session |
| SPA 静态文件缺失 | HTTP 返回 fallback 页面，提示"请先构建 web-dashboard" |

---

## 8. MVP 范围

### 包含

| 模块 | 范围 |
|------|------|
| MCP Server | 3 个 tools + WS + HTTP |
| 浏览器 SPA | 事件面板 + Dashboard 网格 + Widget 容器 |
| 组件 | Column, Row, Text, Button, Input, Table, Chart(bar/line/pie), KPI, Dashboard, Widget, Loading, ErrorFallback |
| 触发 | 自动触发规则 + `/viz` 控制 |
| 交互 | Table 行点击 drilldown, Chart 元素点击 drilldown |

### 不包含（后续迭代）

- 拖拽调整布局
- 实时刷新（refreshInterval）
- 多 session 多 tab
- 数据源直连
- ECharts 全量图表类型

### 验收标准

1. 源码安装：git clone → pnpm install → pnpm build → Claude Code 配置 MCP
2. 用户说"帮我可视化这组数据" → Claude 调用 airui_render → 浏览器自动打开 → 看板渲染正确
3. 用户点击 Table 某行 → Claude 收到 drilldown 事件 → 推理 → 调用 airui_patch → 看板增量更新
4. 用户说"换个饼图" → Claude 调用 airui_patch 替换 Chart type → 看板更新，无需刷新
5. 浏览器断开重连 → 自动恢复当前看板
6. /viz off → Claude 不再自动触发可视化

---

**文档结束**
