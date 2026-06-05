# AIRUI Claude Code Plugin 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 Claude Code MCP 插件，让 Claude 能生成可交互的可视化看板，用户在浏览器中的操作回传给 Claude，形成闭环。

**Architecture:** 单进程 MCP Server（stdio transport）+ 内嵌 HTTP/WS 服务 + SPA 浏览器看板。Claude 通过 3 个 MCP tools（render/patch/event）操作看板，浏览器通过 WebSocket 双向通信。

**Tech Stack:** TypeScript, Node.js, @modelcontextprotocol/sdk, ws, express, Vite, React 19, Zustand, ECharts

---

## File Structure

```
airui-claude-plugin/                          # 新仓库根目录
├── packages/
│   ├── mcp-server/
│   │   ├── src/
│   │   │   ├── index.ts                      # MCP 入口，组装所有模块
│   │   │   ├── tools/
│   │   │   │   ├── definitions.ts            # 3 个 tool 的 schema 定义
│   │   │   │   ├── render.ts                 # airui_render 实现
│   │   │   │   ├── patch.ts                  # airui_patch 实现
│   │   │   │   └── event.ts                  # airui_event 实现
│   │   │   ├── session.ts                    # DashboardSession
│   │   │   ├── ws-bridge.ts                  # WebSocket 服务端
│   │   │   ├── http-server.ts                # HTTP 静态文件服务
│   │   │   └── trigger-rules.ts              # 自动触发规则
│   │   ├── tests/
│   │   │   ├── session.test.ts
│   │   │   ├── ws-bridge.test.ts
│   │   │   ├── render.test.ts
│   │   │   ├── patch.test.ts
│   │   │   └── event.test.ts
│   │   ├── static/                           # web-dashboard 构建产物（构建时复制）
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web-dashboard/
│       ├── src/
│       │   ├── main.tsx                      # SPA 入口
│       │   ├── App.tsx                       # 主布局
│       │   ├── ws-client.ts                  # WebSocket 客户端
│       │   ├── store.ts                      # Zustand store
│       │   └── components/
│       │       ├── EventPanel.tsx             # 左侧事件流
│       │       ├── StatusBar.tsx              # 连接状态
│       │       ├── DashboardView.tsx          # 看板渲染容器
│       │       ├── Dashboard.tsx              # Dashboard 网格组件
│       │       ├── Widget.tsx                 # Widget 卡片组件
│       │       ├── KPI.tsx                    # KPI 指标卡片
│       │       ├── Table.tsx                  # 数据表格
│       │       ├── Chart.tsx                  # ECharts 图表
│       │       ├── Loading.tsx                # 加载态
│       │       └── ErrorFallback.tsx          # 错误降级
│       ├── index.html
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── README.md
```

---

## Task 1: Scaffold Monorepo

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`
- Create: `packages/mcp-server/package.json`, `packages/mcp-server/tsconfig.json`
- Create: `packages/web-dashboard/package.json`, `packages/web-dashboard/tsconfig.json`, `packages/web-dashboard/vite.config.ts`, `packages/web-dashboard/index.html`

- [ ] **Step 1: 创建仓库目录和根配置**

```bash
mkdir -p airui-claude-plugin && cd airui-claude-plugin
```

`package.json`:
```json
{
  "name": "airui-claude-plugin",
  "private": true,
  "scripts": {
    "build": "pnpm -C packages/web-dashboard build && pnpm -C packages/mcp-server build",
    "dev:web": "pnpm -C packages/web-dashboard dev",
    "dev:mcp": "pnpm -C packages/mcp-server dev",
    "test": "pnpm -C packages/mcp-server test"
  }
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - packages/*
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 2: 创建 mcp-server package**

`packages/mcp-server/package.json`:
```json
{
  "name": "@airui/mcp-server",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": { "airui-mcp": "dist/index.js" },
  "scripts": {
    "build": "tsc && node scripts/copy-static.mjs",
    "dev": "tsc --watch",
    "test": "node --experimental-vm-modules node_modules/.bin/vitest run"
  },
  "dependencies": {
    "@air-ui/core": "^0.1.0",
    "@modelcontextprotocol/sdk": "^1.12.0",
    "express": "^5.1.0",
    "open": "^10.1.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/ws": "^8.18.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

`packages/mcp-server/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 web-dashboard package**

`packages/web-dashboard/package.json`:
```json
{
  "name": "@airui/web-dashboard",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "@air-ui/core": "^0.1.0",
    "@air-ui/renderer-react": "^0.1.0",
    "echarts": "^5.6.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.5.0",
    "typescript": "^5.8.0",
    "vite": "^6.4.0"
  }
}
```

`packages/web-dashboard/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

`packages/web-dashboard/vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
});
```

`packages/web-dashboard/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AirUI Dashboard</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 4: 安装依赖并验证**

```bash
cd airui-claude-plugin
pnpm install
```

Expected: 无报错，`node_modules` 生成。

- [ ] **Step 5: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold monorepo with mcp-server and web-dashboard packages"
```

---

## Task 2: DashboardSession

核心状态管理：AIRUI 文档存储 + 浏览器事件队列 + 阻塞式等待。

**Files:**
- Create: `packages/mcp-server/src/session.ts`
- Test: `packages/mcp-server/tests/session.test.ts`

- [ ] **Step 1: 写测试**

`packages/mcp-server/tests/session.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { DashboardSession } from "../src/session.js";

describe("DashboardSession", () => {
  it("setDocument / getDocument", () => {
    const s = new DashboardSession("s1");
    expect(s.getDocument()).toBeNull();
    const doc = { schema: "air-ui@1" as const, viewport: { width: 800, height: 600 }, state: { count: 0 }, root: { type: "Column" } };
    s.setDocument(doc);
    expect(s.getDocument()).toBe(doc);
  });

  it("applyPatches updates document", () => {
    const s = new DashboardSession("s1");
    const doc = { schema: "air-ui@1" as const, viewport: { width: 800, height: 600 }, state: { count: 0 }, root: { type: "Column" } };
    s.setDocument(doc);
    s.applyPatches([{ op: "update-state", stateDelta: { count: 5 } }]);
    expect(s.getDocument()!.state.count).toBe(5);
  });

  it("enqueueEvent and waitForEvent (immediate)", async () => {
    const s = new DashboardSession("s1");
    s.enqueueEvent({ widgetRef: "w1", interaction: "drilldown", payload: { x: 1 }, timestamp: 1000 });
    const events = await s.waitForEvent(1);
    expect(events).toHaveLength(1);
    expect(events[0].widgetRef).toBe("w1");
  });

  it("waitForEvent blocks until event arrives", async () => {
    const s = new DashboardSession("s1");
    const promise = s.waitForEvent(2);
    // Event arrives after a delay
    setTimeout(() => {
      s.enqueueEvent({ widgetRef: "w2", interaction: "select", payload: {}, timestamp: 2000 });
    }, 100);
    const events = await promise;
    expect(events).toHaveLength(1);
    expect(events[0].widgetRef).toBe("w2");
  });

  it("waitForEvent returns empty on timeout", async () => {
    const s = new DashboardSession("s1");
    const events = await s.waitForEvent(0.1);
    expect(events).toHaveLength(0);
  });

  it("clearEvents clears queue", () => {
    const s = new DashboardSession("s1");
    s.enqueueEvent({ widgetRef: "w1", interaction: "click", payload: {}, timestamp: 1 });
    s.clearEvents();
    expect(s["eventQueue"]).toHaveLength(0);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd packages/mcp-server && pnpm test -- tests/session.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: 实现 DashboardSession**

`packages/mcp-server/src/session.ts`:
```typescript
import type { AirUIDocument, Patch } from "@air-ui/core";
import { applyPatches } from "@air-ui/core";

export interface BrowserEvent {
  widgetRef: string;
  interaction: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export class DashboardSession {
  readonly sessionId: string;
  private document: AirUIDocument | null = null;
  private eventQueue: BrowserEvent[] = [];
  private eventWaiters: Array<{
    resolve: (events: BrowserEvent[]) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = [];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  getDocument(): AirUIDocument | null {
    return this.document;
  }

  setDocument(doc: AirUIDocument): void {
    this.document = doc;
    this.eventQueue = [];
  }

  applyPatches(patches: Patch[]): AirUIDocument | null {
    if (!this.document) return null;
    this.document = applyPatches(this.document, patches);
    return this.document;
  }

  enqueueEvent(event: BrowserEvent): void {
    this.eventQueue.push(event);
    while (this.eventWaiters.length > 0 && this.eventQueue.length > 0) {
      const waiter = this.eventWaiters.shift()!;
      clearTimeout(waiter.timer);
      const events = this.eventQueue.splice(0);
      waiter.resolve(events);
    }
  }

  waitForEvent(timeoutSeconds: number): Promise<BrowserEvent[]> {
    if (this.eventQueue.length > 0) {
      return Promise.resolve(this.eventQueue.splice(0));
    }
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        const idx = this.eventWaiters.findIndex((w) => w.resolve === resolve);
        if (idx !== -1) this.eventWaiters.splice(idx, 1);
        resolve([]);
      }, timeoutSeconds * 1000);
      this.eventWaiters.push({ resolve, timer });
    });
  }

  clearEvents(): void {
    this.eventQueue = [];
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd packages/mcp-server && pnpm test -- tests/session.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(mcp): add DashboardSession with event queue and blocking wait"
```

---

## Task 3: WS Bridge

WebSocket 服务端，推送文档/patch 给浏览器，接收交互事件写入 Session。

**Files:**
- Create: `packages/mcp-server/src/ws-bridge.ts`
- Test: `packages/mcp-server/tests/ws-bridge.test.ts`

- [ ] **Step 1: 写测试**

`packages/mcp-server/tests/ws-bridge.test.ts`:
```typescript
import { describe, it, expect, afterEach } from "vitest";
import WebSocket from "ws";
import { DashboardSession } from "../src/session.js";
import { WSBridge } from "../src/ws-bridge.js";

describe("WSBridge", () => {
  let bridge: WSBridge | null = null;
  let port = 19527;

  afterEach(() => {
    bridge?.close();
    bridge = null;
    port++;
  });

  it("pushes document to connected client", async () => {
    const session = new DashboardSession("test");
    bridge = new WSBridge({ port, session });
    await bridge.ready();

    const doc = { schema: "air-ui@1" as const, viewport: { width: 800, height: 600 }, state: {}, root: { type: "Column" } };
    session.setDocument(doc);

    const ws = new WebSocket(`ws://localhost:${port}`);
    const msg = await new Promise<any>((resolve) => {
      ws.on("message", (data) => resolve(JSON.parse(data.toString())));
    });
    expect(msg.type).toBe("document");
    expect(msg.data.schema).toBe("air-ui@1");
    ws.close();
  });

  it("receives interaction from client and enqueues to session", async () => {
    const session = new DashboardSession("test");
    bridge = new WSBridge({ port, session });
    await bridge.ready();

    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve) => ws.on("open", () => resolve()));

    ws.send(JSON.stringify({
      type: "interaction",
      widgetRef: "w1",
      interaction: "drilldown",
      payload: { x: 1 },
    }));

    // Wait for event to be enqueued
    await new Promise((r) => setTimeout(r, 100));
    const events = await session.waitForEvent(0);
    expect(events).toHaveLength(1);
    expect(events[0].widgetRef).toBe("w1");
    ws.close();
  });

  it("pushPatch sends patch message", async () => {
    const session = new DashboardSession("test");
    bridge = new WSBridge({ port, session });
    await bridge.ready();

    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve) => ws.on("open", () => resolve()));
    // Consume the initial empty state message (no document set, so no message)
    
    const patches = [{ op: "update-state" as const, stateDelta: { count: 1 } }];
    bridge.pushPatch(patches);

    const msg = await new Promise<any>((resolve) => {
      ws.on("message", (data) => resolve(JSON.parse(data.toString())));
    });
    expect(msg.type).toBe("patch");
    expect(msg.data).toHaveLength(1);
    ws.close();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd packages/mcp-server && pnpm test -- tests/ws-bridge.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: 实现 WSBridge**

`packages/mcp-server/src/ws-bridge.ts`:
```typescript
import { WebSocketServer, WebSocket } from "ws";
import type { DashboardSession } from "./session.js";
import type { AirUIDocument, Patch } from "@air-ui/core";

export interface WSBridgeConfig {
  port: number;
  session: DashboardSession;
}

export class WSBridge {
  private wss: WebSocketServer;
  private session: DashboardSession;
  private clients: Set<WebSocket> = new Set();

  constructor(config: WSBridgeConfig) {
    this.session = config.session;
    this.wss = new WebSocketServer({ port: config.port });

    this.wss.on("connection", (ws) => {
      this.clients.add(ws);

      // Send current document if exists
      const doc = this.session.getDocument();
      if (doc) {
        ws.send(JSON.stringify({ type: "document", data: doc }));
      }

      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "interaction") {
            this.session.enqueueEvent({
              widgetRef: msg.widgetRef,
              interaction: msg.interaction,
              payload: msg.payload,
              timestamp: Date.now(),
            });
          }
        } catch { /* ignore malformed messages */ }
      });

      ws.on("close", () => this.clients.delete(ws));
    });
  }

  /** Returns a promise that resolves when the server is listening */
  ready(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.on("listening", resolve);
    });
  }

  pushDocument(doc: AirUIDocument, title?: string): void {
    const msg = JSON.stringify({ type: "document", data: doc, title });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    }
  }

  pushPatch(patches: Patch[]): void {
    const msg = JSON.stringify({ type: "patch", data: patches });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    }
  }

  close(): void {
    for (const client of this.clients) {
      client.close();
    }
    this.wss.close();
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd packages/mcp-server && pnpm test -- tests/ws-bridge.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(mcp): add WSBridge for WebSocket communication with browser"
```

---

## Task 4: HTTP Static Server

Express 静态文件服务，serve web-dashboard 构建产物。

**Files:**
- Create: `packages/mcp-server/src/http-server.ts`

- [ ] **Step 1: 实现 HTTP Server**

`packages/mcp-server/src/http-server.ts`:
```typescript
import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = join(__dirname, "..", "static");

export function createHTTPServer(port: number) {
  const app = express();

  app.use(express.static(STATIC_DIR, { fallthrough: true }));

  // SPA fallback: all non-file routes serve index.html
  app.get("*", (_req, res) => {
    res.sendFile(join(STATIC_DIR, "index.html"));
  });

  const server = app.listen(port);
  return server;
}
```

- [ ] **Step 2: 创建构建复制脚本**

`packages/mcp-server/scripts/copy-static.mjs`:
```javascript
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir = join(__dirname, "..", "static");
const webDist = join(__dirname, "..", "..", "web-dashboard", "dist");

if (existsSync(webDist)) {
  mkdirSync(staticDir, { recursive: true });
  cpSync(webDist, staticDir, { recursive: true });
  console.log("Static files copied.");
} else {
  console.warn("web-dashboard dist not found, skipping copy.");
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(mcp): add HTTP static server and build copy script"
```

---

## Task 5: MCP Tool Definitions

3 个 tool 的 JSON Schema 定义。

**Files:**
- Create: `packages/mcp-server/src/tools/definitions.ts`

- [ ] **Step 1: 实现 Tool Definitions**

`packages/mcp-server/src/tools/definitions.ts`:
```typescript
export const renderTool = {
  name: "airui_render",
  description: `Render an AIRUI dashboard in the browser. Use this tool to generate a visual dashboard when:
- The user asks to visualize data (comparisons, trends, distributions)
- The user asks about structure (architecture, dependencies, hierarchies)
- You need to present tabular data with more than 5 rows
- The user explicitly asks to "visualize", "chart", "show me", "draw"

Output a complete AIRUI document. The browser will render it automatically.
User can control with /viz off (disable auto), /viz on (enable), /viz (force).`,
  inputSchema: {
    type: "object" as const,
    properties: {
      document: {
        type: "object",
        description: "Complete AIRUI document (AirUIDocument)",
      },
      open: {
        type: "boolean",
        description: "Auto-open browser. Default: true",
        default: true,
      },
      title: {
        type: "string",
        description: "Browser tab title",
      },
    },
    required: ["document"],
  },
};

export const patchTool = {
  name: "airui_patch",
  description: `Apply incremental patches to the current AIRUI dashboard. Use after receiving user interaction events or when the user requests a modification to the existing dashboard.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      patches: {
        type: "array",
        description: "Array of JSON Patch operations (replace/add/remove/update-state)",
        items: {
          type: "object",
          properties: {
            op: { type: "string", enum: ["replace", "add", "remove", "update-state"] },
            path: { type: "string", description: "JSON Pointer path (for replace/add/remove)" },
            value: { description: "New value (for replace/add)" },
            stateDelta: { type: "object", description: "State merge (for update-state)" },
          },
          required: ["op"],
        },
      },
    },
    required: ["patches"],
  },
};

export const eventTool = {
  name: "airui_event",
  description: `Wait for user interaction events from the browser dashboard. Blocks until events arrive or timeout. Call this after rendering or patching to listen for the user's next action (click, drilldown, filter, etc.).`,
  inputSchema: {
    type: "object" as const,
    properties: {
      timeout: {
        type: "number",
        description: "Wait timeout in seconds. Default: 30, max: 120",
        default: 30,
      },
      filter: {
        type: "object",
        description: "Optional: only return events matching these criteria",
        properties: {
          widgetRef: { type: "string" },
          interaction: { type: "string" },
        },
      },
    },
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat(mcp): add MCP tool definitions for render, patch, event"
```

---

## Task 6: MCP Tool Handlers + Server Entry

实现 3 个 tool 的处理逻辑和 MCP Server 入口。

**Files:**
- Create: `packages/mcp-server/src/tools/render.ts`
- Create: `packages/mcp-server/src/tools/patch.ts`
- Create: `packages/mcp-server/src/tools/event.ts`
- Create: `packages/mcp-server/src/index.ts`
- Test: `packages/mcp-server/tests/render.test.ts`
- Test: `packages/mcp-server/tests/patch.test.ts`

- [ ] **Step 1: 实现 render handler**

`packages/mcp-server/src/tools/render.ts`:
```typescript
import type { AirUIDocument } from "@air-ui/core";
import type { DashboardSession } from "../session.js";
import type { WSBridge } from "../ws-bridge.js";

export interface RenderArgs {
  document: AirUIDocument;
  open?: boolean;
  title?: string;
}

export function handleRender(
  args: RenderArgs,
  session: DashboardSession,
  wsBridge: WSBridge,
  httpUrl: string,
): { content: Array<{ type: string; text: string }> } {
  session.setDocument(args.document);
  wsBridge.pushDocument(args.document, args.title);

  const shouldOpen = args.open !== false;
  if (shouldOpen) {
    import("open").then((mod) => mod.default(httpUrl)).catch(() => {});
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        status: "rendered",
        sessionId: session.sessionId,
        url: httpUrl,
        message: "Dashboard rendered. Waiting for user interaction...",
      }),
    }],
  };
}
```

- [ ] **Step 2: 实现 patch handler**

`packages/mcp-server/src/tools/patch.ts`:
```typescript
import type { Patch } from "@air-ui/core";
import type { DashboardSession } from "../session.js";
import type { WSBridge } from "../ws-bridge.js";

export interface PatchArgs {
  patches: Patch[];
}

export function handlePatch(
  args: PatchArgs,
  session: DashboardSession,
  wsBridge: WSBridge,
): { content: Array<{ type: string; text: string }> } {
  const doc = session.getDocument();
  if (!doc) {
    return {
      content: [{ type: "text", text: JSON.stringify({ status: "error", message: "No dashboard to patch. Call airui_render first." }) }],
    };
  }

  const updated = session.applyPatches(args.patches);
  if (updated) {
    wsBridge.pushPatch(args.patches);
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        status: "patched",
        appliedCount: args.patches.length,
        stateSnapshot: updated?.state ?? {},
      }),
    }],
  };
}
```

- [ ] **Step 3: 实现 event handler**

`packages/mcp-server/src/tools/event.ts`:
```typescript
import type { DashboardSession } from "../session.js";

export interface EventArgs {
  timeout?: number;
  filter?: { widgetRef?: string; interaction?: string };
}

export async function handleEvent(
  args: EventArgs,
  session: DashboardSession,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const timeout = Math.min(args.timeout ?? 30, 120);
  let events = await session.waitForEvent(timeout);

  // Apply filter
  if (args.filter) {
    events = events.filter((e) => {
      if (args.filter!.widgetRef && e.widgetRef !== args.filter!.widgetRef) return false;
      if (args.filter!.interaction && e.interaction !== args.filter!.interaction) return false;
      return true;
    });
  }

  if (events.length === 0) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ status: "timeout", message: `${timeout}s 内无用户交互` }),
      }],
    };
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({ status: "event", events }),
    }],
  };
}
```

- [ ] **Step 4: 写 render + patch 测试**

`packages/mcp-server/tests/render.test.ts`:
```typescript
import { describe, it, expect, afterEach } from "vitest";
import { DashboardSession } from "../src/session.js";
import { WSBridge } from "../src/ws-bridge.js";
import { handleRender } from "../src/tools/render.js";

describe("handleRender", () => {
  let bridge: WSBridge | null = null;
  let port = 19627;

  afterEach(() => { bridge?.close(); bridge = null; port++; });

  it("sets document on session and returns rendered status", async () => {
    const session = new DashboardSession("test");
    bridge = new WSBridge({ port, session });
    await bridge.ready();

    const doc = { schema: "air-ui@1" as const, viewport: { width: 800, height: 600 }, state: { x: 1 }, root: { type: "Column" } };
    const result = handleRender({ document: doc, open: false }, session, bridge, `http://localhost:${port}`);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("rendered");
    expect(parsed.url).toContain("localhost");
    expect(session.getDocument()).toBe(doc);
  });
});
```

`packages/mcp-server/tests/patch.test.ts`:
```typescript
import { describe, it, expect, afterEach } from "vitest";
import { DashboardSession } from "../src/session.js";
import { WSBridge } from "../src/ws-bridge.js";
import { handleRender } from "../src/tools/render.js";
import { handlePatch } from "../src/tools/patch.js";

describe("handlePatch", () => {
  let bridge: WSBridge | null = null;
  let port = 19727;

  afterEach(() => { bridge?.close(); bridge = null; port++; });

  it("applies patches and returns state snapshot", async () => {
    const session = new DashboardSession("test");
    bridge = new WSBridge({ port, session });
    await bridge.ready();

    const doc = { schema: "air-ui@1" as const, viewport: { width: 800, height: 600 }, state: { count: 0 }, root: { type: "Column" } };
    handleRender({ document: doc, open: false }, session, bridge, `http://localhost:${port}`);

    const result = handlePatch({ patches: [{ op: "update-state", stateDelta: { count: 99 } }] }, session, bridge);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("patched");
    expect(parsed.appliedCount).toBe(1);
    expect(parsed.stateSnapshot.count).toBe(99);
  });

  it("returns error when no document exists", async () => {
    const session = new DashboardSession("test");
    bridge = new WSBridge({ port, session });
    await bridge.ready();

    const result = handlePatch({ patches: [{ op: "update-state", stateDelta: { x: 1 } }] }, session, bridge);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe("error");
  });
});
```

- [ ] **Step 5: 运行测试**

```bash
cd packages/mcp-server && pnpm test -- tests/render.test.ts tests/patch.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 6: 实现 MCP Server 入口**

`packages/mcp-server/src/index.ts`:
```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { DashboardSession } from "./session.js";
import { WSBridge } from "./ws-bridge.js";
import { createHTTPServer } from "./http-server.js";
import { renderTool, patchTool, eventTool } from "./tools/definitions.js";
import { handleRender } from "./tools/render.js";
import { handlePatch } from "./tools/patch.js";
import { handleEvent } from "./tools/event.js";

const WS_PORT_START = 9527;

function findAvailablePort(start: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const net = require("net");
    const tryPort = (p: number) => {
      const server = net.createServer();
      server.listen(p, () => { server.close(() => resolve(p)); });
      server.on("error", () => { if (p < start + 100) tryPort(p + 1); else reject(new Error("No available port")); });
    };
    tryPort(start);
  });
}

async function main() {
  const session = new DashboardSession(`session-${Date.now()}`);

  const wsPort = await findAvailablePort(WS_PORT_START);
  const bridge = new WSBridge({ port: wsPort, session });
  await bridge.ready();

  const httpPort = wsPort; // Same port: WS handles /ws, HTTP handles /*
  const httpServer = createHTTPServer(httpPort);
  // Upgrade HTTP server to also handle WebSocket on same port
  // Actually, WS and HTTP share the same port via the HTTP server's upgrade
  // We'll use the WS server's handleUpgrade for this

  const httpUrl = `http://localhost:${httpPort}`;

  const server = new Server(
    { name: "airui", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: [renderTool, patchTool, eventTool],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
      case "airui_render":
        return handleRender(args as any, session, bridge, httpUrl);
      case "airui_patch":
        return handlePatch(args as any, session, bridge);
      case "airui_event":
        return handleEvent(args as any, session);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Cleanup on exit
  process.on("SIGINT", () => {
    bridge.close();
    httpServer.close();
    process.exit(0);
  });
}

main().catch(console.error);
```

> **注意：** 上面 `index.ts` 中 WS 和 HTTP 共用端口的实现需要在后续 Task 中细化——HTTP server 的 `server` 实例传给 `WebSocketServer` 的 `server` 选项来实现端口复用。此处先建立骨架。

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(mcp): implement tool handlers and MCP server entry point"
```

---

## Task 7: 修正端口复用（WS + HTTP 同端口）

Task 6 中 WS 和 HTTP 是两个独立服务。本 Task 让它们共享同一个端口。

**Files:**
- Modify: `packages/mcp-server/src/http-server.ts`
- Modify: `packages/mcp-server/src/ws-bridge.ts`
- Modify: `packages/mcp-server/src/index.ts`

- [ ] **Step 1: 修改 http-server 导出原始 http.Server**

`packages/mcp-server/src/http-server.ts`:
```typescript
import express from "express";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToURL(import.meta.url));
const STATIC_DIR = join(__dirname, "..", "static");

export function createHTTPServer(port: number) {
  const app = express();
  app.use(express.static(STATIC_DIR, { fallthrough: true }));
  app.get("*", (_req, res) => {
    res.sendFile(join(STATIC_DIR, "index.html"));
  });

  const server = createServer(app);
  server.listen(port);
  return server;
}
```

- [ ] **Step 2: 修改 ws-bridge 接受 http.Server**

`packages/mcp-server/src/ws-bridge.ts`:
```typescript
import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import type { DashboardSession } from "./session.js";
import type { AirUIDocument, Patch } from "@air-ui/core";

export interface WSBridgeConfig {
  server: Server; // 共享 HTTP server
  session: DashboardSession;
}

export class WSBridge {
  private wss: WebSocketServer;
  private session: DashboardSession;
  private clients: Set<WebSocket> = new Set();

  constructor(config: WSBridgeConfig) {
    this.session = config.session;
    this.wss = new WebSocketServer({ server: config.server });

    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      const doc = this.session.getDocument();
      if (doc) ws.send(JSON.stringify({ type: "document", data: doc }));
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "interaction") {
            this.session.enqueueEvent({
              widgetRef: msg.widgetRef,
              interaction: msg.interaction,
              payload: msg.payload,
              timestamp: Date.now(),
            });
          }
        } catch { /* ignore */ }
      });
      ws.on("close", () => this.clients.delete(ws));
    });
  }

  ready(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.on("listening", resolve);
    });
  }

  pushDocument(doc: AirUIDocument, title?: string): void {
    const msg = JSON.stringify({ type: "document", data: doc, title });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    }
  }

  pushPatch(patches: Patch[]): void {
    const msg = JSON.stringify({ type: "patch", data: patches });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    }
  }

  close(): void {
    for (const client of this.clients) client.close();
    this.wss.close();
  }
}
```

- [ ] **Step 3: 修改 index.ts 使用同一 server**

`packages/mcp-server/src/index.ts`:
```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { DashboardSession } from "./session.js";
import { WSBridge } from "./ws-bridge.js";
import { createHTTPServer } from "./http-server.js";
import { renderTool, patchTool, eventTool } from "./tools/definitions.js";
import { handleRender } from "./tools/render.js";
import { handlePatch } from "./tools/patch.js";
import { handleEvent } from "./tools/event.js";
import { createServer } from "node:http";
import net from "node:net";

function findAvailablePort(start: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryPort = (p: number) => {
      const s = net.createServer();
      s.listen(p, () => s.close(() => resolve(p)));
      s.on("error", () => p < start + 100 ? tryPort(p + 1) : reject(new Error("No available port")));
    };
    tryPort(start);
  });
}

async function main() {
  const session = new DashboardSession(`session-${Date.now()}`);
  const port = await findAvailablePort(9527);

  const httpServer = createHTTPServer(port);
  const bridge = new WSBridge({ server: httpServer, session });

  // Wait until server is actually listening
  await new Promise<void>((resolve) => httpServer.on("listening", resolve));

  const httpUrl = `http://localhost:${port}`;

  const server = new Server(
    { name: "airui", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: [renderTool, patchTool, eventTool],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
      case "airui_render":
        return handleRender(args as any, session, bridge, httpUrl);
      case "airui_patch":
        return handlePatch(args as any, session, bridge);
      case "airui_event":
        return handleEvent(args as any, session);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on("SIGINT", () => {
    bridge.close();
    httpServer.close();
    process.exit(0);
  });
}

main().catch(console.error);
```

- [ ] **Step 4: 更新 ws-bridge 测试以使用共享 server**

`packages/mcp-server/tests/ws-bridge.test.ts` 中，将 `new WSBridge({ port, session })` 改为使用 http.Server：

```typescript
import { createServer } from "node:http";

// 在每个测试中：
const httpServer = createServer();
httpServer.listen(port);
bridge = new WSBridge({ server: httpServer, session });
```

同步更新 `tests/render.test.ts` 和 `tests/patch.test.ts` 中的 WSBridge 构造方式。

- [ ] **Step 5: 运行全部测试**

```bash
cd packages/mcp-server && pnpm test
```

Expected: 所有测试 PASS。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor(mcp): share single port between HTTP and WebSocket"
```

---

## Task 8: Web Dashboard Scaffold + WS Client + Store

浏览器 SPA 的基础骨架：WebSocket 客户端、Zustand store、主布局。

**Files:**
- Create: `packages/web-dashboard/src/main.tsx`
- Create: `packages/web-dashboard/src/store.ts`
- Create: `packages/web-dashboard/src/ws-client.ts`
- Create: `packages/web-dashboard/src/App.tsx`

- [ ] **Step 1: 实现 Zustand Store**

`packages/web-dashboard/src/store.ts`:
```typescript
import { create } from "zustand";
import type { AirUIDocument, Patch } from "@air-ui/core";
import { applyPatches } from "@air-ui/core";

export interface DashboardEvent {
  widgetRef: string;
  interaction: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface DashboardState {
  doc: AirUIDocument | null;
  connected: boolean;
  sessionId: string | null;
  events: DashboardEvent[];

  setDoc: (doc: AirUIDocument) => void;
  applyPatch: (patches: Patch[]) => void;
  setConnected: (connected: boolean) => void;
  setSessionId: (id: string) => void;
  addEvent: (event: DashboardEvent) => void;
  clearEvents: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  doc: null,
  connected: false,
  sessionId: null,
  events: [],

  setDoc: (doc) => set({ doc }),
  applyPatch: (patches) => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: applyPatches(doc, patches) });
  },
  setConnected: (connected) => set({ connected }),
  setSessionId: (sessionId) => set({ sessionId }),
  addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
  clearEvents: () => set({ events: [] }),
}));
```

- [ ] **Step 2: 实现 WS Client**

`packages/web-dashboard/src/ws-client.ts`:
```typescript
import type { AirUIDocument, Patch } from "@air-ui/core";
import { useDashboardStore } from "./store";

let ws: WebSocket | null = null;

export function connectWebSocket(url: string) {
  ws = new WebSocket(url);

  ws.onopen = () => {
    useDashboardStore.getState().setConnected(true);
    ws!.send(JSON.stringify({ type: "ready" }));
  };

  ws.onclose = () => {
    useDashboardStore.getState().setConnected(false);
    // Auto reconnect after 3s
    setTimeout(() => connectWebSocket(url), 3000);
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data as string);
    switch (msg.type) {
      case "document":
        useDashboardStore.getState().setDoc(msg.data);
        if (msg.title) document.title = msg.title;
        break;
      case "patch":
        useDashboardStore.getState().applyPatch(msg.data);
        break;
      case "status":
        useDashboardStore.getState().setConnected(msg.connected);
        if (msg.sessionId) useDashboardStore.getState().setSessionId(msg.sessionId);
        break;
    }
  };
}

export function sendInteraction(
  widgetRef: string,
  interaction: string,
  payload: Record<string, unknown>,
) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const event = { widgetRef, interaction, payload };
  ws.send(JSON.stringify({ type: "interaction", ...event }));
  useDashboardStore.getState().addEvent({ ...event, timestamp: Date.now() });
}
```

- [ ] **Step 3: 实现 App 布局骨架**

`packages/web-dashboard/src/App.tsx`:
```tsx
import { useEffect } from "react";
import { useDashboardStore } from "./store";
import { connectWebSocket } from "./ws-client";

export default function App() {
  const doc = useDashboardStore((s) => s.doc);
  const connected = useDashboardStore((s) => s.connected);
  const events = useDashboardStore((s) => s.events);

  useEffect(() => {
    const wsUrl = `ws://${window.location.host}`;
    connectWebSocket(wsUrl);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* 左侧事件面板 */}
      <div style={{ width: 240, borderRight: "1px solid #e0e0e0", padding: 12, overflow: "auto", background: "#fafafa" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: 14 }}>Events</h3>
        <div style={{ marginBottom: 8, fontSize: 12, color: connected ? "#2e7d32" : "#c62828" }}>
          {connected ? "● Connected" : "○ Disconnected"}
        </div>
        {events.slice(-20).reverse().map((e, i) => (
          <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid #eee", fontSize: 12 }}>
            <strong>{e.interaction}</strong> → {e.widgetRef}
          </div>
        ))}
      </div>
      {/* 右侧看板区域 */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {!doc ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999" }}>
            Waiting for dashboard...
          </div>
        ) : (
          <pre style={{ fontSize: 12 }}>{JSON.stringify(doc, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 实现 main.tsx 入口**

`packages/web-dashboard/src/main.tsx`:
```tsx
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(<App />);
```

- [ ] **Step 5: 运行 dev 验证**

```bash
cd packages/web-dashboard && pnpm dev
```

Expected: 浏览器打开 Vite dev server，显示"Waiting for dashboard..."和"Disconnection"（因为 WS server 还没跑，这是预期行为）。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(web): scaffold SPA with WebSocket client, store, and layout"
```

---

## Task 9: AIRUI 扩展渲染组件（Dashboard, Widget, KPI）

为 renderer-react 扩展 Dashboard/Widget/KPI 组件，注册到 SPA 中。

**Files:**
- Create: `packages/web-dashboard/src/components/Dashboard.tsx`
- Create: `packages/web-dashboard/src/components/Widget.tsx`
- Create: `packages/web-dashboard/src/components/KPI.tsx`

- [ ] **Step 1: 实现 Dashboard 组件**

`packages/web-dashboard/src/components/Dashboard.tsx`:
```tsx
import type { FC } from "react";
import type { Component } from "@air-ui/core";

const gapMap: Record<string, string> = { small: "8px", medium: "16px", large: "24px" };

export const Dashboard: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const columns = (resolvedProps.columns as number) ?? 3;
  const gap = gapMap[(resolvedProps.gap as string) ?? "medium"] ?? "16px";

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap, padding: 16 }}>
      {comp.children?.map((child, i) => {
        const childProps = child.props ?? {};
        const colSpan = (childProps.colSpan as number) ?? 1;
        const rowSpan = (childProps.rowSpan as number) ?? 1;
        return (
          <div key={child.ref ?? i} style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}>
            {/* Widget rendering will be handled by AirUIComponent */}
            <WidgetWrapper comp={child} />
          </div>
        );
      })}
    </div>
  );
};

// Widget wrapper - imports dynamically to avoid circular deps
import { AirUIComponent } from "@air-ui/renderer-react";
function WidgetWrapper({ comp }: { comp: Component }) {
  // For Dashboard children, render as Widget if type is Widget,
  // otherwise render normally via AirUIComponent
  if (comp.type === "Widget") return <Widget comp={comp} />;
  return <AirUIComponent comp={comp} />;
}
```

> **注意：** Dashboard 直接 import AirUIComponent 会与 renderer-react 的注册机制冲突。实际实现时需要通过 registry 或 context 注入渲染函数。此处先建立逻辑骨架。

- [ ] **Step 2: 实现 Widget 组件**

`packages/web-dashboard/src/components/Widget.tsx`:
```tsx
import { type FC, useState } from "react";
import type { Component } from "@air-ui/core";
import { AirUIComponent } from "@air-ui/renderer-react";

export const Widget: FC<{ comp: Component }> = ({ comp }) => {
  const props = comp.props ?? {};
  const title = props.title as string | undefined;
  const loading = props.loading as boolean | false;

  return (
    <div style={{
      border: "1px solid #e0e0e0",
      borderRadius: 8,
      overflow: "hidden",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#fff",
    }}>
      {title && (
        <div style={{
          padding: "8px 12px",
          borderBottom: "1px solid #e0e0e0",
          fontWeight: 600,
          fontSize: 13,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span>{title}</span>
          {loading && <span style={{ fontSize: 12, color: "#999" }}>⏳</span>}
        </div>
      )}
      <div style={{ flex: 1, padding: 12, overflow: "auto" }}>
        {comp.children?.map((child, i) => (
          <AirUIComponent key={child.ref ?? i} comp={child} />
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 实现 KPI 组件**

`packages/web-dashboard/src/components/KPI.tsx`:
```tsx
import type { FC } from "react";

export const KPI: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const label = resolvedProps.label as string;
  const value = resolvedProps.value as string;
  const change = resolvedProps.change as string | undefined;
  const trend = resolvedProps.trend as string | undefined;

  const isUp = trend === "up" || (change && change.startsWith("+"));
  const isDown = trend === "down" || (change && change.startsWith("-"));
  const color = isUp ? "#2e7d32" : isDown ? "#c62828" : "#333";
  const arrow = isUp ? "↑" : isDown ? "↓" : "";

  return (
    <div style={{ textAlign: "center", padding: 12 }}>
      {label && <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{label}</div>}
      <div style={{ fontSize: "1.8rem", fontWeight: "bold", color }}>{value}</div>
      {change && (
        <div style={{ fontSize: 13, color, marginTop: 2 }}>
          {arrow} {change}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(web): add Dashboard, Widget, KPI renderer components"
```

---

## Task 10: Table + Chart 组件

带交互的 Table（行点击 drilldown）和 ECharts Chart。

**Files:**
- Create: `packages/web-dashboard/src/components/Table.tsx`
- Create: `packages/web-dashboard/src/components/Chart.tsx`

- [ ] **Step 1: 实现 Table 组件**

`packages/web-dashboard/src/components/Table.tsx`:
```tsx
import type { FC } from "react";
import { sendInteraction } from "../ws-client";

interface ColumnDef {
  key: string;
  label: string;
  action?: string;
  color?: string;
}

export const Table: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const data = (resolvedProps.data as Record<string, unknown>[]) ?? [];
  const columns = (resolvedProps.columns as ColumnDef[]) ?? [];

  const handleRowClick = (row: Record<string, unknown>, index: number) => {
    // Find if any column has action
    const actionCol = columns.find((c) => c.action);
    if (actionCol) {
      sendInteraction(comp.ref ?? "table", "drilldown", { row: row, index, column: actionCol.key });
    }
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #e0e0e0", fontWeight: 600 }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr
            key={i}
            onClick={() => handleRowClick(row, i)}
            style={{
              cursor: columns.some((c) => c.action) ? "pointer" : "default",
              borderBottom: "1px solid #f0f0f0",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {columns.map((col) => {
              const val = row[col.key];
              const color = col.color === "signed"
                ? String(val).startsWith("+") ? "#2e7d32" : String(val).startsWith("-") ? "#c62828" : "#333"
                : "#333";
              return (
                <td key={col.key} style={{ padding: "6px 8px", color }}>
                  {String(val ?? "")}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

- [ ] **Step 2: 实现 Chart 组件**

`packages/web-dashboard/src/components/Chart.tsx`:
```tsx
import { type FC, useRef, useEffect } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { sendInteraction } from "../ws-client";

echarts.use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

export const Chart: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartType = (resolvedProps.type as string) ?? "bar";
  const data = resolvedProps.data;

  useEffect(() => {
    if (!chartRef.current || !data) return;

    const chart = echarts.init(chartRef.current);

    const labels = (data as any).labels ?? [];
    const values = (data as any).values ?? [];

    const option: any = {
      tooltip: {},
      xAxis: chartType !== "pie" ? { type: "category", data: labels } : undefined,
      yAxis: chartType !== "pie" ? { type: "value" } : undefined,
      series: [{
        type: chartType,
        data: chartType === "pie"
          ? labels.map((l: string, i: number) => ({ name: l, value: values[i] }))
          : values,
      }],
    };

    chart.setOption(option);

    chart.on("click", (params: any) => {
      sendInteraction(comp.ref ?? "chart", "drilldown", {
        category: params.name,
        value: params.value,
        seriesIndex: params.seriesIndex,
      });
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [data, chartType]);

  return <div ref={chartRef} style={{ width: "100%", height: 300 }} />;
};
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(web): add Table (drilldown) and Chart (ECharts) components"
```

---

## Task 11: Loading + ErrorFallback + 组件注册

完成剩余反馈组件，并将所有自定义组件注册到 renderer-react 的 registry。

**Files:**
- Create: `packages/web-dashboard/src/components/Loading.tsx`
- Create: `packages/web-dashboard/src/components/ErrorFallback.tsx`
- Create: `packages/web-dashboard/src/components/register.ts`

- [ ] **Step 1: 实现 Loading**

`packages/web-dashboard/src/components/Loading.tsx`:
```tsx
import type { FC } from "react";

export const Loading: FC = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: "#999" }}>
    Loading...
  </div>
);
```

- [ ] **Step 2: 实现 ErrorFallback**

`packages/web-dashboard/src/components/ErrorFallback.tsx`:
```tsx
import type { FC } from "react";

export const ErrorFallback: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => (
  <div style={{ padding: 16, textAlign: "center", color: "#c62828" }}>
    <div style={{ fontSize: 16, marginBottom: 4 }}>⚠️ Error</div>
    <div style={{ fontSize: 13 }}>{(resolvedProps.message as string) ?? "Something went wrong"}</div>
    {resolvedProps.retryable && <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>Retrying...</div>}
  </div>
);
```

- [ ] **Step 3: 注册所有自定义组件**

`packages/web-dashboard/src/components/register.ts`:
```typescript
import { registerComponent } from "@air-ui/renderer-react";
import { Dashboard } from "./Dashboard";
import { KPI } from "./KPI";
import { Table } from "./Table";
import { Chart } from "./Chart";
import { ErrorFallback } from "./ErrorFallback";
import { Loading } from "./Loading";

export function registerCustomComponents() {
  registerComponent("Dashboard", Dashboard);
  registerComponent("KPI", KPI);
  registerComponent("Table", Table);
  registerComponent("Chart", Chart);
  registerComponent("ErrorFallback", ErrorFallback as any);
  registerComponent("Loading", Loading as any);
  // Widget is handled specially by Dashboard, not via registry
}
```

- [ ] **Step 4: 更新 App.tsx 使用真实渲染**

修改 `App.tsx` 中的看板区域，从 `<pre>` 改为使用 DashboardView：

`packages/web-dashboard/src/components/DashboardView.tsx`:
```tsx
import { useDashboardStore } from "../store";
import { AirUIComponent } from "@air-ui/renderer-react";

export function DashboardView() {
  const doc = useDashboardStore((s) => s.doc);
  if (!doc) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999" }}>
        Waiting for dashboard...
      </div>
    );
  }
  return <AirUIComponent comp={doc.root} />;
}
```

更新 `App.tsx` 引入注册和 DashboardView：

```tsx
import { useEffect } from "react";
import { useDashboardStore } from "./store";
import { connectWebSocket } from "./ws-client";
import { registerCustomComponents } from "./components/register";
import { DashboardView } from "./components/DashboardView";

// Register on module load
registerCustomComponents();

export default function App() {
  // ... 同 Task 8 的 App 布局，但看板区域改为 <DashboardView />
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): add Loading, ErrorFallback, component registry, and DashboardView"
```

---

## Task 12: Trigger Rules

自动触发规则的实现——通过 tool description 动态调整引导 Claude。

**Files:**
- Create: `packages/mcp-server/src/trigger-rules.ts`

- [ ] **Step 1: 实现触发规则**

`packages/mcp-server/src/trigger-rules.ts`:
```typescript
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { renderTool } from "./tools/definitions.js";

const CONFIG_PATH = join(tmpdir(), "airui-viz-config.json");

interface VizConfig {
  autoTrigger: boolean;
}

function readConfig(): VizConfig {
  if (!existsSync(CONFIG_PATH)) return { autoTrigger: true };
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return { autoTrigger: true };
  }
}

function writeConfig(config: VizConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config));
}

export function setAutoTrigger(enabled: boolean): void {
  writeConfig({ autoTrigger: enabled });
}

export function getAutoTrigger(): boolean {
  return readConfig().autoTrigger;
}

/** Returns the render tool definition, with auto-trigger guidance based on config */
export function getRenderToolForConfig() {
  const config = readConfig();
  if (!config.autoTrigger) {
    return {
      ...renderTool,
      description: "Render an AIRUI dashboard in the browser. Auto-trigger is OFF. Only use when the user explicitly requests visualization (/viz to force).",
    };
  }
  return renderTool;
}
```

- [ ] **Step 2: 在 MCP Server 中使用动态 tool**

修改 `packages/mcp-server/src/index.ts` 的 `ListToolsRequestSchema` handler：

```typescript
import { getRenderToolForConfig } from "./trigger-rules.js";

// 替换 ListToolsRequestSchema handler:
server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: [getRenderToolForConfig(), patchTool, eventTool],
}));
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(mcp): add trigger rules with auto-trigger config"
```

---

## Task 13: Build Pipeline

完善构建流程，确保 `pnpm build` 一键构建所有内容。

**Files:**
- Modify: `package.json` (root)
- Verify: `packages/mcp-server/scripts/copy-static.mjs`

- [ ] **Step 1: 验证构建流程**

```bash
cd airui-claude-plugin
pnpm build
```

Expected:
1. `web-dashboard` Vite build 成功 → `packages/web-dashboard/dist/`
2. `mcp-server` TypeScript 编译成功 → `packages/mcp-server/dist/`
3. `copy-static.mjs` 将 web-dashboard dist 复制到 `packages/mcp-server/static/`

如有路径问题，调整 `copy-static.mjs` 中的路径。

- [ ] **Step 2: 手动验证 MCP Server 可启动**

```bash
cd packages/mcp-server
node dist/index.js
```

Expected: 进程启动，监听 stdio（因为没有 Claude Code 连接会立即退出，但不应有 import 错误）。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: verify build pipeline for mcp-server and web-dashboard"
```

---

## Task 14: Smoke Test — 完整闭环验证

端到端验证整个交互循环。

**Files:**
- 无新文件，纯验证

- [ ] **Step 1: 构建**

```bash
cd airui-claude-plugin
pnpm build
```

- [ ] **Step 2: 配置 Claude Code MCP**

在项目 `.claude/settings.json` 中添加：

```json
{
  "mcpServers": {
    "airui": {
      "command": "node",
      "args": ["c:/Users/Lison/Desktop/EvfWorkSpace/airui-claude-plugin/packages/mcp-server/dist/index.js"]
    }
  }
}
```

- [ ] **Step 3: 启动 Claude Code 并测试**

在 Claude Code 中执行：

```
帮我可视化这组数据：[{"name":"A","value":120},{"name":"B","value":200},{"name":"C","value":150}]
```

Expected:
1. Claude 调用 `airui_render`
2. 浏览器自动打开，显示看板
3. 用户点击图表/表格元素
4. Claude 收到 drilldown 事件
5. Claude 推理后调用 `airui_patch` 更新看板

- [ ] **Step 4: 验收项逐一确认**

```
□ 源码安装成功
□ 自然语言触发 → 浏览器打开 → 看板渲染
□ 点击 Table 行 → drilldown 事件回传 → patch 更新
□ 对话修改看板 → patch 生效
□ /viz off → 不自动触发
```

- [ ] **Step 5: Final Commit**

```bash
git add -A && git commit -m "chore: verify end-to-end smoke test for MVP"
```

---

**计划结束**
