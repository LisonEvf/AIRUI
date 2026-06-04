# 即时交互看板设计规格

**版本**：1.0  
**日期**：2026-06-03  

---

## 1. 核心概念

PPT 的本质是**一叠幻灯片**，每张片子的布局和内容由演讲者按需组合。没人会预制所有可能的 PPT——你只需要一个画布 + 元素库 + 即时组合的能力。

把这个逻辑搬到数据看板上：**不需要预制仪表盘模板，Agent 根据用户意图实时组合组件，生成一张"活的幻灯片"**。

```
传统看板: 设计师画模板 → 开发绑定数据 → 用户看固定面板 → 改需求提工单
即时看板: 用户说一句话 → Agent 实时推理 → 输出 AIR-UI → 渲染 → 交互 → 再推理 → patch 演化
```

核心差异：看板不是"做出来的"，是"聊出来的"。

---

## 2. 交互模型

### 2.1 三层循环

```
┌──────────────────────────────────────────────────────────────────┐
│                        用户视图层                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Widget A │  │ Widget B │  │ Widget C │  │ Widget D │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │             │             │             │                │
│  ─────┴─────────────┴─────────────┴─────────────┴─────           │
│                    emit 事件层                                    │
│  drilldown | filter | sort | timeframe | export | annotate       │
│  ───────────────────────┬──────────────────────────────           │
│                         ↓                                        │
│                    Agent 推理层                                   │
│              上下文 + 意图识别 → 决策                              │
│              ├── 回答：输出完整 AIR-UI 文档                        │
│              ├── 微调：输出 patch                                 │
│              ├── 查询：调用 MCP 工具 → patch 数据                  │
│              └── 无操作：静默                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 用户输入方式

| 方式 | 示例 | Agent 响应 |
|------|------|-----------|
| 自然语言（聊天框） | "对比下北上广深的房价走势" | 生成新 Widget 或整页 |
| 点击交互（emit） | 点击柱状图的某个柱子 | 下钻/筛选，patch 更新 |
| 拖拽/手势 | 把时间范围从"月"拉到"周" | 重聚合数据，patch 更新 |
| 空闲观察 | 用户盯着某个图表看了 30s | 主动提示异常或建议 |

---

## 3. 布局系统：流体网格

不使用固定模板，而是用**流体网格 + 自适应槽位**。类比 PPT 的"占位符"概念。

### 3.1 布局组件

```typescript
// 新增内置组件
interface DashboardLayout {
  type: "Dashboard";
  props: {
    /** 网格列数，Agent 动态决定 */
    columns: number;
    /** 间距 */
    gap: "small" | "medium" | "large";
  };
  children: Widget[];
}

interface Widget {
  type: "Widget";
  props: {
    /** 标题栏 */
    title?: string;
    /** 占据几列 */
    colSpan?: number;
    /** 占据几行 */
    rowSpan?: number;
    /** 加载状态 */
    loading?: boolean;
    /** 可交互标记 */
    interactive?: boolean;
  };
  /** Widget 内部可以是任意 AIR-UI 组件树 */
  children: Component[];
}
```

### 3.2 自适应示例

用户说"看一眼销售概况"：

```json
{
  "type": "Dashboard",
  "props": { "columns": 3, "gap": "medium" },
  "children": [
    {
      "type": "Widget",
      "props": { "title": "总销售额", "colSpan": 1 },
      "children": [
        { "type": "KPI", "props": { "value": "¥1,280万", "trend": "up", "change": "+12.3%" } }
      ]
    },
    {
      "type": "Widget",
      "props": { "title": "月度趋势", "colSpan": 2 },
      "children": [
        { "type": "Chart", "props": { "type": "line", "data": "@state.monthlySales" } }
      ]
    },
    {
      "type": "Widget",
      "props": { "title": "TOP 5 产品", "colSpan": 1 },
      "children": [
        { "type": "Table", "props": { "data": "@state.topProducts", "columns": ["name", "revenue", "growth"] } }
      ]
    },
    {
      "type": "Widget",
      "props": { "title": "区域分布", "colSpan": 2 },
      "children": [
        { "type": "Chart", "props": { "type": "pie", "data": "@state.regionShare" } }
      ]
    }
  ]
}
```

Agent 根据数据特征自动决定：
- KPI 数字 → `colSpan: 1`（窄）
- 趋势图需要宽度 → `colSpan: 2`（宽）
- 表格和饼图各占一半

### 3.3 布局动态调整

```
用户: "月度趋势放大看看"
→ patch: [
    { "op": "replace", "path": "/root/children/1/props/colSpan", "value": 3 },
    { "op": "replace", "path": "/root/children/1/props/rowSpan", "value": 2 }
  ]

用户: "把 KPI 收起来"
→ patch: [
    { "op": "remove", "path": "/root/children/0" }
  ]

用户: "再加一个客户满意度评分"
→ patch: [
    { "op": "add", "path": "/root/children/3", "value": {
      "type": "Widget",
      "props": { "title": "客户满意度", "colSpan": 1 },
      "children": [{ "type": "Gauge", "props": { "value": 87, "max": 100 } }]
    }}
  ]
```

---

## 4. Widget 交互协议

### 4.1 统一事件模型

所有 Widget 内部的交互都通过 `emit` 上报到 Agent，由 Agent 决定后续动作：

```typescript
// Widget 级别的交互事件（由渲染器自动包装）
interface WidgetEmit {
  /** 哪个 Widget */
  widgetRef: string;
  /** 事件类型 */
  interaction: "drilldown" | "filter" | "sort" | "timeframe" | "select" | "hover";
  /** 事件载荷 */
  payload: Record<string, unknown>;
}
```

### 4.2 典型交互链路

**场景：用户点击柱状图的"华东"柱子**

```
1. 渲染器识别 → 用户点击了 Chart Widget 的 "华东" 柱子
2. 渲染器 emit:
   {
     "widgetRef": "sales-by-region",
     "interaction": "drilldown",
     "payload": { "dimension": "region", "value": "华东" }
   }
3. Agent 推理:
   - 用户想看华东的详细数据
   - 当前已有数据？ → 无，需要查询
4. Agent 调用 MCP 工具查询华东细分数据
5. Agent 输出 patch:
   [
     { "op": "add", "path": "/root/children/-", "value": {
       "type": "Widget",
       "props": { "title": "华东 - 城市明细", "colSpan": 2 },
       "children": [{ "type": "Chart", "props": { "type": "bar", "data": "..." } }]
     }}
   ]
6. 界面新增一个 Widget，无需刷新整个看板
```

### 4.3 交互响应策略矩阵

Agent 收到 emit 事件后的决策逻辑：

| 交互类型 | 数据已就绪 | 数据需查询 | 数据不可得 |
|---------|-----------|-----------|-----------|
| drilldown | patch 展开子视图 | MCP 查询 → patch | emit 提示"暂无数据" |
| filter | patch 更新 state.filter | — | — |
| sort | patch 更新排序 | — | — |
| timeframe | patch 更新 state.timerange → MCP 重拉 | — | — |
| select | patch 高亮关联 Widget | — | — |
| hover | patch 显示 tooltip（本地） | — | — |

---

## 5. 即时数据绑定

### 5.1 数据来源声明

Widget 不绑定固定 API，而是声明**数据意图**，由 Agent 在运行时解析：

```json
{
  "type": "Widget",
  "props": { "title": "今日涨跌幅排行" },
  "dataIntent": {
    "domain": "stock",
    "query": "按涨跌幅排序的 A 股列表，前 20",
    "refreshInterval": 5000
  },
  "children": [
    { "type": "Table", "props": { "data": "@state.topMovers" } }
  ]
}
```

`dataIntent` 是给 Agent 的提示，不是给渲染器的。Agent 看到后：
1. 选择合适的 MCP 工具（如 `mcp__tdx__stock_quotes_list`）
2. 查询数据
3. 将结果写入 `state.topMovers`
4. 渲染器自动更新表格

### 5.2 实时刷新

```typescript
// Agent 在首次生成时注入定时器指令
{
  "type": "Widget",
  "dataIntent": {
    "domain": "stock",
    "query": "实时行情",
    "refreshInterval": 3000  // 3 秒刷新
  }
}

// 渲染器识别 refreshInterval 后：
// 1. 每 3 秒 emit("refresh", {widgetRef: "realtime-quotes"})
// 2. Agent 收到后调用 MCP 获取最新数据
// 3. 输出 update-state patch
```

### 5.3 数据不可用时的降级

```
Agent 推理数据查询失败 → patch:
[
  { "op": "replace", "path": "/root/children/2/props/loading", "value": false },
  { "op": "replace", "path": "/root/children/2/children/0/type", "value": "ErrorFallback" },
  { "op": "replace", "path": "/root/children/2/children/0/props", "value": {
    "message": "该数据源暂时不可用",
    "retryable": true
  }}
]
```

---

## 6. 聊天驱动的看板演化

### 6.1 对话面板设计

看板左侧是可收起的聊天面板（类似 Cursor 的 Chat 侧栏）：

```
┌──────────┬──────────────────────────────────────────────┐
│          │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  Chat    │  │ Widget A │ │ Widget B │ │ Widget C │      │
│  Panel   │  └─────────┘ └─────────┘ └─────────┘       │
│          │  ┌───────────────────┐ ┌─────────┐          │
│ ┌──────┐ │  │    Widget D       │ │ Widget E │          │
│ │Input │ │  └───────────────────┘ └─────────┘          │
│ └──────┘ │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 6.2 对话 → 看板的映射规则

| 用户说 | Agent 动作 | 产出 |
|-------|-----------|------|
| "看一下 X" | 查询 X 相关数据，生成 Widget | 新 Widget 或新页面 |
| "不对，应该是 Y" | 修改上一个操作的参数 | patch 修正 |
| "去掉这个" | 删除指定 Widget | patch remove |
| "X 和 Y 对比" | 并排两个 Widget 或合并图表 | patch add |
| "放大" | 增大 colSpan/rowSpan | patch replace |
| "导出" | 调用宿主 export 函数 | call 动作 |
| "换个图" | 替换图表类型（bar→line） | patch replace |

### 6.3 上下文记忆

Agent 维护对话上下文，理解指代：

```
用户: "看下新能源板块"
Agent: [生成新能源板块概览看板]

用户: "里面哪个票资金流入最多"    ← "里面" = 新能源板块
Agent: [查询 → 在看板中追加资金流向排名 Widget]

用户: "把它拉出来单独看"          ← "它" = 资金流向排名
Agent: [移除其他 Widget，将资金流向 Widget 扩展为全宽]
```

---

## 7. 完整 AIR-UI 文档示例

以**股票实时看板**为例，展示完整的即时生成过程：

### 7.1 初始生成

```
用户: "帮我搭一个盯盘看板，关注新能源和半导体"

Agent 输出完整 AIR-UI 文档:
```

```json
{
  "schema": "air-ui@1",
  "viewport": { "width": 1200, "height": 800 },
  "state": {
    "plates": ["新能源", "半导体"],
    "timerange": "today",
    "selectedStock": null,
    "marketOverview": {
      "indices": [
        { "name": "上证", "value": 3312.5, "change": "+0.8%" },
        { "name": "深成", "value": 10856.3, "change": "+1.2%" },
        { "name": "创业板", "value": 2156.7, "change": "+1.5%" }
      ]
    },
    "plateData": {
      "新能源": { "change": "+2.3%", "leadStock": "宁德时代", "flowIn": "+18.5亿" },
      "半导体": { "change": "+1.1%", "leadStock": "中芯国际", "flowIn": "+9.2亿" }
    },
    "topStocks": [
      { "code": "300750", "name": "宁德时代", "price": 218.5, "change": "+3.2%", "volume": "56.8亿" },
      { "code": "688981", "name": "中芯国际", "price": 68.3, "change": "+2.1%", "volume": "23.4亿" }
    ]
  },
  "root": {
    "type": "Dashboard",
    "props": { "columns": 4, "gap": "medium" },
    "children": [
      {
        "type": "Widget",
        "ref": "market-indices",
        "props": { "title": "大盘指数", "colSpan": 4 },
        "children": [
          {
            "type": "Row",
            "props": { "gap": "large", "align": "center" },
            "children": [
              { "type": "KPI", "props": { "label": "上证", "value": "3312.5", "trend": "up", "change": "+0.8%" } },
              { "type": "KPI", "props": { "label": "深成", "value": "10856.3", "trend": "up", "change": "+1.2%" } },
              { "type": "KPI", "props": { "label": "创业板", "value": "2156.7", "trend": "up", "change": "+1.5%" } }
            ]
          }
        ]
      },
      {
        "type": "Widget",
        "ref": "plate-cards",
        "props": { "title": "关注板块", "colSpan": 2 },
        "on": {
          "click": {
            "action": "emit",
            "event": { "type": "plateDrilldown", "payload": "$event" }
          }
        },
        "children": [
          {
            "type": "Row",
            "props": { "gap": "medium" },
            "children": [
              { "type": "PlateCard", "props": { "name": "新能源", "change": "+2.3%", "lead": "宁德时代", "flow": "+18.5亿" } },
              { "type": "PlateCard", "props": { "name": "半导体", "change": "+1.1%", "lead": "中芯国际", "flow": "+9.2亿" } }
            ]
          }
        ]
      },
      {
        "type": "Widget",
        "ref": "top-stocks",
        "props": { "title": "龙头股监控", "colSpan": 2 },
        "dataIntent": {
          "domain": "stock",
          "query": "新能源和半导体板块涨幅前10",
          "refreshInterval": 5000
        },
        "children": [
          {
            "type": "Table",
            "props": {
              "data": "@state.topStocks",
              "columns": [
                { "key": "name", "label": "名称", "action": "drilldown" },
                { "key": "price", "label": "现价" },
                { "key": "change", "label": "涨跌幅", "color": "signed" },
                { "key": "volume", "label": "成交额" }
              ]
            }
          }
        ]
      },
      {
        "type": "Widget",
        "ref": "stock-detail",
        "props": { "title": "个股详情", "colSpan": 4 },
        "children": [
          { "type": "Text", "props": { "value": "点击上方股票查看详情", "style": "placeholder" } }
        ]
      }
    ]
  }
}
```

### 7.2 交互演化

```
用户点击 "宁德时代" 行
→ emit: { type: "drilldown", widgetRef: "top-stocks", payload: { code: "300750", name: "宁德时代" } }

Agent 推理:
  - 调用 mcp__tdx__stock_kline 获取 K 线
  - 调用 mcp__tdx__indicator_macd 获取 MACD
  - 调用 mcp__tdx__symbol_zjlx 获取资金流向

Agent 输出 patch:
```

```json
[
  {
    "op": "replace",
    "path": "/root/children/3",
    "value": {
      "type": "Widget",
      "ref": "stock-detail",
      "props": { "title": "宁德时代 (300750) — 实时详情", "colSpan": 4 },
      "children": [
        {
          "type": "Row",
          "props": { "gap": "large" },
          "children": [
            {
              "type": "Chart",
              "props": {
                "type": "candlestick",
                "data": "@state.klineData",
                "indicators": ["MA5", "MA20", "MACD"]
              }
            },
            {
              "type": "Column",
              "props": { "gap": "small", "width": 300 },
              "children": [
                { "type": "KPI", "props": { "label": "现价", "value": "218.5", "trend": "up", "change": "+3.2%" } },
                { "type": "KPI", "props": { "label": "成交额", "value": "56.8亿" } },
                { "type": "Text", "props": { "value": "主力净流入: +3.2亿", "style": "positive" } },
                {
                  "type": "MiniChart",
                  "props": { "type": "bar", "data": "@state.zjlxData", "title": "资金流向" }
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    "op": "update-state",
    "stateDelta": {
      "selectedStock": "300750",
      "klineData": "...(K线数据)...",
      "zjlxData": "...(资金流向数据)..."
    }
  }
]
```

### 7.3 持续演化

```
用户: "把半导体去掉，换成军工"
→ patch:
[
  { "op": "replace", "path": "/state/plates/1", "value": "军工" },
  { "op": "replace", "path": "/root/children/1/children/0/children/1/props", "value": {
    "name": "军工", "change": "+0.8%", "lead": "中航沈飞", "flow": "+5.6亿"
  }},
  { "op": "update-state", "stateDelta": {
    "plateData.半导体": null,
    "plateData.军工": { "change": "+0.8%", "leadStock": "中航沈飞", "flowIn": "+5.6亿" }
  }}
]
→ 同时 Agent 更新 topStocks 数据
```

---

## 8. 新增组件清单

为支持即时看板，需在 AIR-UI 内置组件之上扩展：

### 8.1 布局组件

| 组件 | 说明 | 关键 props |
|------|------|-----------|
| `Dashboard` | 流体网格布局 | `columns`, `gap` |
| `Widget` | 卡片容器（标题栏 + 内容区） | `title`, `colSpan`, `rowSpan`, `loading`, `interactive` |

### 8.2 展示组件

| 组件 | 说明 | 关键 props |
|------|------|-----------|
| `KPI` | 关键指标卡片 | `label`, `value`, `trend`, `change`, `icon` |
| `PlateCard` | 板块卡片 | `name`, `change`, `lead`, `flow` |
| `Gauge` | 仪表盘 | `value`, `max`, `ranges` |
| `MiniChart` | 迷你图（sparkline） | `type`, `data` |

### 8.3 数据组件（已有扩展）

| 组件 | 说明 | 关键 props |
|------|------|-----------|
| `Table` | 数据表格 | `data`, `columns`, `sortable`, `filterable` |
| `Chart` | 图表（已有） | 新增 `candlestick`, `heatmap` 类型 |

### 8.4 反馈组件

| 组件 | 说明 | 关键 props |
|------|------|-----------|
| `ErrorFallback` | 错误降级 | `message`, `retryable` |
| `EmptyState` | 空状态 | `message`, `suggestion` |
| `Loading` | 加载态 | `skeleton` |

---

## 9. 渲染器实现要点

### 9.1 Dashboard 网格渲染

```tsx
function DashboardRenderer({ resolvedProps, comp }) {
  const columns = resolvedProps.columns ?? 3;
  const gap = resolvedProps.gap ?? "medium";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: gapMap[gap],
      padding: 16,
    }}>
      {comp.children?.map(child => {
        const colSpan = child.props?.colSpan ?? 1;
        const rowSpan = child.props?.rowSpan ?? 1;
        return (
          <div key={child.ref} style={{
            gridColumn: `span ${colSpan}`,
            gridRow: `span ${rowSpan}`,
          }}>
            <AirUIComponent comp={child} />
          </div>
        );
      })}
    </div>
  );
}
```

### 9.2 Widget 容器

```tsx
function WidgetRenderer({ comp, resolvedProps }) {
  const [loading, setLoading] = useState(resolvedProps.loading ?? false);

  return (
    <div className="widget-card" style={{
      border: "1px solid #e0e0e0",
      borderRadius: 8,
      overflow: "hidden",
      height: "100%",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* 标题栏 */}
      {resolvedProps.title && (
        <div className="widget-header" style={{
          padding: "8px 12px",
          borderBottom: "1px solid #e0e0e0",
          fontWeight: 600,
          fontSize: 13,
          display: "flex",
          justifyContent: "space-between",
        }}>
          <span>{resolvedProps.title}</span>
          {loading && <Spinner />}
        </div>
      )}
      {/* 内容区 */}
      <div style={{ flex: 1, padding: 12, overflow: "auto" }}>
        {comp.children?.map(child => <AirUIComponent key={child.ref} comp={child} />)}
      </div>
    </div>
  );
}
```

### 9.3 emit 自动包装

渲染器在 Widget 级别自动包装 emit 事件，附加 `widgetRef`：

```typescript
// 在 Widget 渲染时拦截子组件的 emit
function wrapEmitWithWidgetRef(widgetRef: string, handler: EventHandler): EventHandler {
  if (handler.action === "emit" && handler.event) {
    return {
      ...handler,
      event: { ...handler.event, widgetRef },
    };
  }
  return handler;
}
```

---

## 10. Agent Prompt 策略

### 10.1 System Prompt 核心片段

```
你是一个即时数据看板 Agent。用户通过自然语言或界面交互告诉你他们的需求，
你输出 AIR-UI 文档或 patch 来生成/演化看板。

规则：
1. 首次请求 → 输出完整 AirUIDocument
2. 后续修改 → 只输出 Patch（优先用 update-state）
3. 用户点击 Widget 触发 drilldown → 查询数据 → patch 更新
4. 不确定用户意图时 → patch 插入一个 Text 组件提问确认
5. 数据查询失败 → patch 替换为 ErrorFallback
6. 始终保持 Dashboard 布局的 colSpan 总和 = columns 数

可用工具：
- mcp__tdx__* （通达信行情数据）
- mcp__kpl__* （开盘啦情绪/板块数据）
```

### 10.2 输出格式约束

```typescript
// Agent 的每个回复必须是以下之一：
type AgentOutput =
  | { type: "document"; data: AirUIDocument }    // 首次生成
  | { type: "patch"; data: Patch[] }              // 增量更新
  | { type: "message"; data: string }             // 纯文本回复（少见）
  | { type: "none" }                              // 静默（无需更新）
```

---

## 11. 实施步骤（按优先级排序）

### 数据获取难度评估

在排优先级之前，先盘点已有数据源和获取难度：

#### 🟢 零成本（MCP 工具已就绪，直接调用）

| 数据 | MCP 工具 | 可支撑的 Widget |
|------|---------|----------------|
| 大盘指数概览 | `mcp__tdx__get_index_overview` | KPI 指标条 |
| 个股实时行情 | `mcp__tdx__stock_quotes`, `stock_quotes_details` | Table、KPI |
| 股票列表（涨幅/跌幅/成交排名） | `mcp__tdx__stock_quotes_list` | Table 排行榜 |
| K 线数据 | `mcp__tdx__stock_kline` | Chart（candlestick） |
| 分时图 | `mcp__tdx__stock_tick_chart` | Chart（line） |
| 技术指标（MA/MACD/KDJ/RSI/BOLL/EMA/ATR） | `mcp__tdx__indicator_*` | Chart overlay |
| 板块成分股行情 | `mcp__tdx__board_members_quotes` | Table、PlateCard |
| 股票所属板块 | `mcp__tdx__symbol_belong_board` | 板块标签 |
| 板块排名 | `mcp__kpl__plate_ranking` | 板块排行榜 |
| 资金流向 | `mcp__tdx__symbol_zjlx` | MiniChart（bar）、KPI |
| 龙虎榜 | `mcp__kpl__lhb_today`, `lhb_stock_list` | Table |
| 涨停基因 | `mcp__kpl__stock_zhangting_gene` | 涨停分析面板 |
| 市场情绪 | `mcp__kpl__emotion_today`, `emotion_homepage` | Gauge、情绪仪表盘 |
| 个股 F10 | `mcp__tdx__stock_f10` | 基本面详情面板 |
| 板块详情 | `mcp__kpl__plate_range_info` | 板块详情 Widget |
| 主题/概念 | `mcp__kpl__theme_info`, `theme_stock_option` | 概念板块筛选 |

#### 🟡 低成本（工具已有，需轻量适配）

| 数据 | 说明 | 工作量 |
|------|------|--------|
| 实时逐笔成交 | `stock_transaction` 数据量大，需聚合 | 加聚合逻辑 |
| 历史大单 | `stock_history_orders` | 无障碍，直接用 |
| 竞价数据 | `stock_auction` | 无障碍，直接用 |
| 异动股 | `stock_unusual` | 无障碍，直接用 |
| 大盘市场监控 | `market_monitor` | 无障碍，直接用 |
| 板块动量 | `stock_index_momentum` | 无障碍，直接用 |

#### 🔴 需要额外工作（无直接 MCP 工具）

| 数据 | 缺失原因 | 替代方案 |
|------|---------|---------|
| 新闻情感分析 | 有 `news_list/news_search` 但无情感标注 | LLM 内联分析 |
| 自选股持久化 | 无存储层 | 本地 localStorage |
| 用户画偏好 | 无用户系统 | 对话上下文推断 |

#### 结论

> **90%+ 的看板场景数据已就绪**。股票盯盘看板是最理想的 MVP 落地场景——零外部依赖，MCP 工具链完整覆盖行情、指标、资金、板块、情绪全链路。

---

### 优先级排序

```
P0  ──→  能跑起来的最小闭环（看得到数据、点得动）
P1  ──→  Agent 接管（自然语言驱动、自动推理）
P2  ──→  生产级打磨（实时刷新、异常处理、性能优化）
```

#### P0-1：Dashboard + Widget 网格渲染

**做什么**：实现 `Dashboard`（CSS Grid）和 `Widget`（卡片容器）两个组件，注册到 renderer-react。

**数据依赖**：无。纯 UI 组件。

**产出**：在 Playground 中输入带 Dashboard/Widget 的 JSON，能看到网格卡片布局。

**验证标准**：
```
输入 examples/dashboard.json → 渲染出 3 列网格，每个 Widget 有标题栏 + 内容区
输入 patch [{op: replace, path: "...colSpan", value: 2}] → Widget 横跨两列
```

#### P0-2：KPI + Table 展示组件

**做什么**：实现 `KPI`（指标卡片，支持 trend 箭头 + 变色）和 `Table`（基础表格，支持列定义 + 行点击）。

**数据依赖**：无。先用静态 JSON 数据渲染。

**产出**：看板中能展示数字指标和数据表格。

**验证标准**：
```
KPI 组件：value 涨/跌变色（红/绿），trend 箭头方向正确
Table 组件：按 columns 定义渲染表头，data 数组渲染行，行可点击
```

#### P0-3：硬接线 MCP 数据 → 静态看板

**做什么**：不走 Agent，直接在 Playground 中硬编码调用 MCP 工具获取真实数据，填充到 AIR-UI 文档的 state 中。

**数据依赖**：🟢 全部就绪。优先接入以下工具（按使用频率排序）：

| 接入顺序 | MCP 工具 | 填充到 state 的字段 | 对应 Widget |
|---------|---------|-------------------|------------|
| 1 | `get_index_overview` | `marketOverview` | KPI 指标条 |
| 2 | `stock_quotes_list`（按涨幅排序） | `topStocks` | Table 排行榜 |
| 3 | `plate_ranking` | `plateData` | PlateCard |
| 4 | `symbol_zjlx` | `flowData` | MiniChart（bar） |
| 5 | `stock_kline` | `klineData` | Chart（candlestick） |
| 6 | `emotion_today` | `sentiment` | Gauge |

**产出**：一个能看到真实行情数据的静态看板（大盘指数 + 排行榜 + 板块卡片）。

**验证标准**：
```
打开 Playground → 自动调用 MCP → 看到上证/深成/创业板实时指数
涨幅排行榜显示真实股票名和价格
板块卡片显示真实涨跌幅和龙头股
```

> **P0 里程碑：可以看到真实数据的静态看板。至此投入最小，价值可见。**

#### P1-1：Widget emit 事件 + Agent 事件循环

**做什么**：
1. Widget 内的 Table 行点击、Chart 元素点击统一 emit `drilldown` 事件
2. Agent 侧监听 `air-ui-event`，根据事件类型推理并输出 patch
3. 建立"用户点击 → Agent 推理 → MCP 查询 → patch 更新"闭环

**数据依赖**：🟢 已就绪。drilldown 场景对应：

| 用户操作 | Agent 调用 MCP | patch 动作 |
|---------|---------------|-----------|
| 点击股票行 | `stock_kline` + `symbol_zjlx` | 替换详情 Widget |
| 点击板块卡片 | `board_members_quotes` | 替换板块成分股 Table |
| 点击 K 线图某天 | `stock_history_orders` | 补充当日大单明细 |

**产出**：点击看板元素，看板能动态响应、展开详情。

#### P1-2：聊天面板 + 自然语言驱动

**做什么**：在 Playground 左侧增加 Chat 面板，用户输入自然语言，Agent 输出 AIR-UI 文档或 patch。

**数据依赖**：🟢 同上。新增场景：

| 用户说 | Agent 推理 + MCP 调用 |
|-------|---------------------|
| "帮我盯新能源" | `plate_ranking` 过滤新能源 + `board_members_quotes` |
| "看看宁德时代的 MACD" | `stock_kline` + `indicator_macd` |
| "今天涨停的票有哪些" | `stock_zhangting_gene` + `stock_quotes_list` |
| "资金在往哪跑" | `symbol_zjlx` 聚合 + `plate_ranking` |

**产出**：用户可以通过聊天创建/修改看板。

> **P1 里程碑：完整的 Agent 闭环——聊天 + 点击都能驱动看板演化。**

#### P2-1：refreshInterval + 实时数据推送

**做什么**：
1. Widget 支持 `dataIntent.refreshInterval`，渲染器定时 emit refresh 事件
2. Agent 收到后调用 MCP 刷新数据，输出 `update-state` patch
3. 指标组件（KPI/Table）支持局部更新动画

**数据依赖**：🟢 无新增。复用 P0-3 已接入的 MCP 工具。

**产出**：看板数据自动刷新，无需手动操作。

#### P2-2：异常降级 + Loading 状态 + 错误恢复

**做什么**：
1. Widget 的 `loading` 状态 → 显示骨架屏
2. MCP 调用失败 → patch 替换为 `ErrorFallback`
3. 网络断开重连后自动 retry

**数据依赖**：无新增。

**产出**：看板在各种异常情况下表现稳定。

#### P2-3：PlateCard + Gauge + MiniChart 扩展组件

**做什么**：实现 P0-2 未覆盖的展示组件，丰富看板视觉。

**数据依赖**：
- PlateCard → 🟢 `plate_ranking` + `board_members_quotes`
- Gauge → 🟢 `emotion_today`
- MiniChart → 🟢 `symbol_zjlx`

**产出**：看板视觉更丰富，板块/情绪/资金流向有专属组件。

---

### 里程碑总览

```
Week 1-2 ─── P0-1 + P0-2 ─── 网格布局 + KPI + Table 组件
Week 3   ─── P0-3 ─────────── 接入 MCP 真实数据，静态看板可看
                          ★ P0 里程碑：真实数据看板 Demo ★
Week 4-5 ─── P1-1 ─────────── emit 事件 + Agent 交互闭环
Week 6-7 ─── P1-2 ─────────── 聊天面板 + 自然语言驱动
                          ★ P1 里程碑：Agent 驱动的交互看板 ★
Week 8+  ─── P2-1/2/3 ────── 实时刷新 + 异常处理 + 扩展组件
                          ★ P2 里程碑：生产就绪 ★
```

---

**文档结束**
