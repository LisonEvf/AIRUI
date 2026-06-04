# AIR-UI 生态实施计划文档  
**版本**：1.0  
**日期**：2026-06-03  
**状态**：草案  

---

## 1. 概述

AIR-UI（AI-Ready User Interface）是一种为大型语言模型（LLM）原生设计的用户界面中间表示（IR）。它放弃了HTML/CSS/JS的文档模型，采用**强结构化JSON**、**显式状态槽**、**意图级事件**和**增量patch机制**，使AI能够以极低的token成本、高确定性、高响应速度生成和演化动态UI。

本计划文档旨在规范AIR-UI的核心语义，提供完整的解析器实现指南，并通过分阶段实施路线图，确保从原型验证到生产部署的平滑过渡。

### 1.1 设计目标
- **Token效率**：比HTML减少60%以上的输出长度。
- **状态一致性**：UI状态始终挂载于根对象，消除DOM与JS闭包的状态漂移。
- **事件语义化**：模型输出领域动作（如 `drilldown`），而非低级 `click`。
- **增量渲染**：原生支持JSON Patch，推理延迟降低50%以上。
- **可扩展性**：通过组件库和插件机制适配不同垂直领域。

---

## 2. 规范定义

### 2.1 整体结构
```typescript
interface AirUIDocument {
  schema: "air-ui@1";
  viewport: { width: number; height: number };
  state: Record<string, any>;            // 全局状态
  root: Component;                       // 根组件树
  components?: Record<string, ComponentDefinition>; // 可复用组件定义
}
```

### 2.2 组件模型
```typescript
interface Component {
  type: string;              // 内置或自定义组件名
  props?: Record<string, any>;
  state?: Record<string, any>;        // 局部状态
  children?: Component[];
  slots?: Record<string, Component>;   // 具名插槽
  on?: Record<string, EventHandler>;
  ref?: string;              // 供父组件引用的标识
}

interface EventHandler {
  when?: string;             // 自然语言或条件表达式（可选）
  action: "mutate" | "set" | "emit" | "call";
  target?: string;           // 状态路径，如 "state.counter"
  by?: number;               // 用于 mutate
  value?: any;               // 用于 set
  event?: any;               // 用于 emit 的结构化事件
}
```

### 2.3 内置组件类型（最小集合）
| 组件名 | 说明 | 关键props |
|--------|------|-----------|
| `Column` | 垂直布局 | `gap`, `padding`, `align` |
| `Row` | 水平布局 | `gap`, `padding`, `align` |
| `Text` | 文本 | `value`（支持模板 `{state.xxx}`）, `style` |
| `Button` | 按钮 | `label`, `disabled` |
| `Image` | 图片 | `src`, `alt` |
| `Input` | 输入框 | `value`, `placeholder`, `type` |
| `Dropdown` | 下拉选择 | `options`, `selected` |
| `Chart` | 图表（扩展） | `data`, `mapping`, `type` |

### 2.4 状态路径语法
- 全局状态：`@state.foo.bar` 或简写 `state.foo.bar`
- 局部状态：`state.xxx`（优先查找组件自身 `state` 字段，然后向上继承）
- 动态值：`{state.user.name}` 用于字符串插值

### 2.5 事件动作详解

| action | 说明 | 示例 |
|--------|------|------|
| `mutate` | 对数值状态进行增减 | `{"action":"mutate","target":"state.counter","by":1}` |
| `set` | 将状态设置为新值 | `{"action":"set","target":"state.selected","value":"$event.id"}` |
| `emit` | 向外派发结构化事件（供父组件或外部agent监听） | `{"action":"emit","event":{"type":"drilldown","dimension":"region"}}` |
| `call` | 调用渲染器宿主环境提供的函数（如 `navigate`, `toast`） | `{"action":"call","function":"navigate","args":["/detail"]}` |

### 2.6 增量更新（Patch）格式
基于 [RFC 6902 JSON Patch](https://tools.ietf.org/html/rfc6902) 的子集，但路径指向 AIR-UI 文档内的节点。
```typescript
type Patch = 
  | { op: "replace"; path: string; value: any }
  | { op: "add"; path: string; value: any }
  | { op: "remove"; path: string }
  | { op: "update-state"; stateDelta: Record<string, any> }; // 便捷合并状态
```
`path` 以 `/root/children/0/props/value` 形式或 `/state/counter` 访问根状态。

---

## 3. 解析器实现指南

解析器负责将 AIR-UI JSON 渲染为目标平台（Web, React Native, 小程序等）的真实界面。下面以 **Web + React** 为例，给出核心实现模块。

### 3.1 模块架构
```
[AirUI Renderer]
   ├── Parser (JSON validator)
   ├── State Manager (observable)
   ├── Component Registry
   ├── Patch Applier
   └── Render Engine (JSX)
```

### 3.2 状态管理（使用 Zustand 示例）
```typescript
import { create } from 'zustand';

const useAirUIStore = create((set, get) => ({
  doc: null,
  setDoc: (doc) => set({ doc }),
  updateState: (path, value) => {
    const doc = get().doc;
    const newDoc = _.set(doc, path, value); // 使用 lodash set
    set({ doc: newDoc });
  },
  applyPatch: (patch) => { /* 实现 JSON Patch */ }
}));
```

### 3.3 组件映射（动态渲染）
```tsx
function AirUIComponent({ comp }) {
  const state = useAirUIStore();
  const resolvedProps = resolveProps(comp.props, state.doc.state);
  
  switch (comp.type) {
    case 'Column':
      return <div style={{ display: 'flex', flexDirection: 'column', gap: resolvedProps.gap }}>
        {comp.children?.map(child => <AirUIComponent key={child.ref} comp={child} />)}
      </div>;
    case 'Button':
      return <button onClick={() => handleEvent(comp.on?.click)}>{resolvedProps.label}</button>;
    // ... 其他组件
    default:
      // 自定义组件查找
      const CustomComp = componentRegistry[comp.type];
      return CustomComp ? <CustomComp {...resolvedProps} /> : null;
  }
}
```

### 3.4 事件处理与状态变更
```typescript
function handleEvent(handler: EventHandler, eventData?: any) {
  const { action, target, by, value, event: emitEvent } = handler;
  if (action === 'mutate') {
    const current = _.get(state.doc, target);
    _.set(state.doc, target, current + (by || 1));
  } else if (action === 'set') {
    const finalValue = interpolateValue(value, eventData);
    _.set(state.doc, target, finalValue);
  } else if (action === 'emit') {
    // 发送事件给外部 agent
    window.dispatchEvent(new CustomEvent('air-ui-event', { detail: emitEvent }));
  }
}
```

### 3.5 增量更新 API
```typescript
function applyPatchStream(patches: Patch[]) {
  for (const patch of patches) {
    if (patch.op === 'update-state') {
      stateStore.setState({ doc: { ...stateStore.doc, state: { ...stateStore.doc.state, ...patch.stateDelta } } });
    } else {
      const newDoc = jsonpatch.applyPatch(stateStore.doc, [patch]).newDocument;
      stateStore.setDoc(newDoc);
    }
  }
}
```

---

## 4. 完整样例

### 4.1 计数器应用
```json
{
  "schema": "air-ui@1",
  "viewport": { "width": 300, "height": 200 },
  "state": { "count": 0 },
  "root": {
    "type": "Column",
    "props": { "gap": "medium", "align": "center" },
    "children": [
      {
        "type": "Text",
        "props": { "value": "Count: {state.count}", "style": "title" }
      },
      {
        "type": "Row",
        "props": { "gap": "small" },
        "children": [
          {
            "type": "Button",
            "props": { "label": "-" },
            "on": { "click": { "action": "mutate", "target": "state.count", "by": -1 } }
          },
          {
            "type": "Button",
            "props": { "label": "+" },
            "on": { "click": { "action": "mutate", "target": "state.count", "by": 1 } }
          }
        ]
      }
    ]
  }
}
```

### 4.2 带增量 patch 的交互
**初始文档**（由模型第一次输出）  
用户点击“+”按钮后，模型不必重新输出整个文档，只需输出：
```json
[
  { "op": "update-state", "stateDelta": { "count": 1 } }
]
```
渲染器自动更新文本显示。模型也可以输出替换子树的 patch，例如替换图表数据。

### 4.3 数据看板场景（领域事件）
```json
{
  "type": "Chart",
  "props": { "data": "@state.salesData", "type": "bar" },
  "on": {
    "barClick": {
      "when": "event.seriesName === 'region'",
      "action": "emit",
      "event": { "type": "drilldown", "dimension": "region", "value": "$event.category" }
    }
  }
}
```
外部 agent 监听 `air-ui-event`，收到 `drilldown` 后请求新数据，再输出 patch 更新 `state.salesData`。

---

## 5. 实施步骤

### 阶段 0：准备（第 1-2 周）
- 成立技术小组，确定目标垂直领域（建议从**数据看板/内部工具**开始）。
- 评审 AIR-UI 规范，根据领域需求扩展组件列表（如增加 `Table`, `Form` 等）。
- 建立 Git 仓库，包含规范文档、验证 JSON Schema、示例集。

**交付物**：规范 v1.0 JSON Schema，20+ 基础示例。

### 阶段 1：MVP 渲染器（第 3-6 周）
- 实现 Web 端 React 渲染器，支持：
  - 解析完整 AIR-UI 文档
  - 状态管理与单向数据流
  - 5 个核心组件（Column, Row, Text, Button, Input）
  - 事件处理（`mutate`, `set`）
- 实现一个简单的 playground，手动输入 JSON 查看渲染结果。
- 编写单元测试（Jest + React Testing Library）。

**交付物**：NPM 包 `@air-ui/renderer-react`，版本 0.1.0。

### 阶段 2：增量更新与 Patch 引擎（第 7-10 周）
- 实现 JSON Patch 应用器（可使用 `fast-json-patch` 库）。
- 在渲染器中支持 streaming patch 输入（WebSocket 或 事件总线）。
- 增加性能测试：对比完整重绘 vs patch 渲染的延迟。

**交付物**：patch 引擎集成，benchmark 报告。

### 阶段 3：LLM 适配层（第 11-14 周）
- 构建 prompt 模板：将自然语言设计请求转化为 AIR-UI 文档。
- 微调一个小型 LLM（如 Llama 3 8B）输出 AIR-UI 格式（使用 LoRA，收集 5000 条交互轨迹）。
- 实现“事件 → 下一个动作”的 agent 循环：监听用户触发的 `emit` 事件 → 调用 LLM 生成 patch → 应用 patch。

**交付物**：微调模型权重（或适配 OpenAI Function Calling 的示例代码）。

### 阶段 4：组件库与生态（第 15-20 周）
- 扩展组件库：Chart（基于 ECharts）、Table、Modal、Tabs、Form（含校验）。
- 开发 VSCode 插件，支持 AIR-UI JSON 的语法高亮、预览。
- 编写开发者文档：组件开发指南、如何为垂直领域定制新组件。
- 启动示例应用：一个动态数据看板 + 一个低代码表单构建器。

**交付物**：完整组件库，官方文档站点，两个参考应用。

### 阶段 5：生产就绪与性能优化（第 21-24 周）
- 增加渲染器服务端渲染（SSR）支持。
- 实现 patch 压缩（gzip）和批量处理。
- 添加安全沙箱：对 `call` 动作进行白名单控制。
- 进行负载测试：模拟高并发 UI 更新场景（如 100 个图表同时接收 patch）。

**交付物**：生产就绪 v1.0.0 发布，性能报告（TP99 < 50ms 应用 patch）。

---

## 6. 评估标准

| 指标 | 目标值 | 测试方法 |
|------|--------|----------|
| Token 压缩率 | 比等效 HTML 少 60% | 随机选取 50 个 UI 设计，分别用 HTML 和 AIR-UI 描述，对比平均字符数。 |
| patch 应用延迟 | P99 < 30ms | 在普通 PC 浏览器上应用 1000 个随机 patch，使用 `performance.now()` 测量。 |
| 状态一致性 | 无漂移 | 连续 1000 次随机状态更新后，UI 显示与根状态对象始终一致（自动化测试）。 |
| LLM 生成准确率 | 输出的 AIR-UI 符合 schema 比例 > 95% | 使用微调模型在测试集上运行，统计 JSON 验证通过率。 |
| 组件扩展成本 | 新组件开发 < 2 人天 | 新增一个 `Slider` 组件，从定义规范到渲染器集成的时间。 |

---

## 7. 风险与对策

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| LLM 难以稳定输出结构化 JSON | 高 | 高 | 使用约束解码（如 Guidance、Outlines）或 Function Calling；提供验证修复层。 |
| 复杂布局（如网格、绝对定位）难以用内置组件表达 | 中 | 中 | 扩展 `Grid` 组件；保留 `HTML` 逃生舱（嵌入原始 HTML 片段）。 |
| 增量 patch 导致状态不一致 | 中 | 高 | 在 patch 应用前后进行状态快照比对；使用乐观更新 + 回滚机制。 |
| 社区接受度低 | 低 | 中 | 开放转换工具（HTML → AIR-UI 的 LLM 转换器），降低迁移成本。 |

---

## 8. 附录

### A. 术语表
- **AIR-UI**：AI-Ready User Interface，本文定义的中间语言。
- **Patch**：描述 UI 变化的增量更新指令。
- **Intent Event**：领域相关的语义事件（如 `drilldown`），而非 `click`。

### B. 参考实现资源
- JSON Patch 标准：https://tools.ietf.org/html/rfc6902
- React 状态管理：Zustand, Jotai
- 约束解码库：Outlines (https://github.com/outlines-dev/outlines)

### C. 贡献指南
欢迎通过 GitHub PR 提交扩展组件、修复解析器 bug、添加示例。所有贡献需通过规范兼容性测试。

---

**文档结束**