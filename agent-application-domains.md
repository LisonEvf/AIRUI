# AIR-UI Agent 应用领域白皮书

**版本**：1.0  
**日期**：2026-06-03  

---

## 0. 核心论点

Vibe Coding 的成功揭示了一个范式：**当 LLM 的 IO 媒介与应用场景的核心载体同构时，AI 的介入深度和效果会产生质的飞跃。** 代码是文本，LLM 天生处理文本，所以 coding agent 效果极好。

AIR-UI 将 UI 从 HTML/CSS/JS 的文档模型转化为 LLM 原生可读写的结构化 JSON IR。这意味着 **UI 本身成为了 LLM 的 IO 媒介**——模型不仅"理解"界面，还能直接"生成"和"演化"界面。以此为基座构建的 Agent，其交互模式不再是"文字提问 → 文字回答"，而是：

```
用户意图/事件 → LLM 推理 → AIR-UI 文档/Patch → 渲染器 → 可视界面 → 用户反馈
     ↑                                                                    ↓
     └──────────── emit 事件 / 状态变更 ←──────────────────────────────────┘
```

下面按领域逐一展开。

---

## 1. 金融交易与分析终端

### 1.1 场景描述

交易员需要同时监控数十个指标、快速做出决策。传统终端（如通达信、Bloomberg）界面固定、定制成本高。基于 AIR-UI 的 Agent 可以：

- **动态生成看板**：交易员说"帮我盯一下新能源板块的异动"，Agent 实时生成包含板块涨跌、资金流向、龙头股 K 线的自适应看板
- **意图级交互**：点击某只股票的 K 线图时，触发 `drilldown` 事件而非原生 click，Agent 理解为"用户想深入分析这只股票"，自动补充分时图、龙虎榜、板块关联
- **告警与响应闭环**：当 RSI 超买信号触发 `emit`，Agent 推理是否需要推送通知或调整止损线，并通过 `update-state` patch 实时更新界面

### 1.2 交互示例

```
用户: "把创业板涨幅前10的票拉出来，叠加主力资金流向"

Agent 输出 AIR-UI 文档:
{
  "schema": "air-ui@1",
  "state": {
    "stocks": [...],       // 从 TDX 接口实时拉取
    "sortBy": "zhangfu",
    "timerange": "today"
  },
  "root": {
    "type": "Column",
    "children": [
      { "type": "Table", "props": { "data": "@state.stocks", "columns": [...] } },
      { "type": "Chart", "props": { "type": "bar", "data": "@state.flowData" } }
    ]
  }
}

用户点击某行 → emit("stockDetail", {code: "300xxx"}) 
→ Agent 调用 MCP 工具获取详情 → patch 更新右侧面板
```

### 1.3 AIR-UI 优势

| 对比维度 | 传统方案 | AIR-UI Agent |
|---------|---------|-------------|
| 界面定制 | 需开发/配置 | 自然语言驱动 |
| 数据联动 | 硬编码逻辑 | Agent 动态推理 |
| 多维钻取 | 固定跳转路径 | 意图理解，自由探索 |
| Token 成本 | HTML 模板庞大 | 结构化 JSON，节省 60%+ |

---

## 2. 企业数据看板与 BI

### 2.1 场景描述

企业 BI 工具（Tableau、Power BI）的核心痛点：**分析路径是预设的**。用户想问一个仪表盘没覆盖的问题，就需要找数据团队排期。

AIR-UI Agent 让每个业务人员都拥有一个"数据分析师"：

- **对话式探索**：用户描述需求，Agent 自动选择数据源、聚合维度、图表类型，生成 AIR-UI 文档
- **渐进式细化**：用户说"不对，按地区拆一下"，Agent 输出 patch 而非重新生成整个页面
- **异常归因**：当数据出现异常（如某区域销售额骤降），Agent 主动高亮并 emit `anomaly` 事件，推荐下钻维度

### 2.2 交互循环

```
1. 用户: "上个月各产品线的营收对比"
   → Agent 生成: Column[Text("月度营收") + Chart(type=bar, data=...)]

2. 用户点击某个柱子 
   → emit("drilldown", {product: "SaaS", month: "May"})
   → Agent 推理: 补充该产品的客户细分饼图
   → patch: add /root/children/0/children/[新的Chart组件]

3. 用户: "为什么 SaaS 这个月跌了"
   → Agent 结合数据源分析原因
   → 输出 patch: 在图表下方插入 Column[Text("归因分析...") + Table(异常因子)]
```

### 2.3 关键能力映射

| AIR-UI 能力 | BI 场景价值 |
|------------|-----------|
| `emit` 意图事件 | 钻取、筛选、导出等操作直接触发 Agent 推理 |
| `update-state` patch | 实时刷新图表数据，无需全量重绘 |
| 组件注册扩展 | 按企业需求注册专属图表（桑基图、漏斗图等） |
| `call` 动作 | 触发导出 PDF、发送邮件、钉钉通知等宿主能力 |

---

## 3. 运维监控与 Incident Response

### 3.1 场景描述

SRE/运维面对的是**高频、高压、多源异构**的信息洪流。现有监控平台（Grafana、Datadog）的问题是：**看板是静态的，告警是扁平的**。

AIR-UI Agent 能构建**自适应态势感知界面**：

- **告警聚合看板**：收到 Prometheus 告警后，Agent 自动生成关联拓扑图，标注故障节点
- **动态视图切换**：从全局概览 → 单服务详情 → 单次请求链路追踪，每一步都是 Agent 根据上下文推理生成
- **协同作战面板**：多人 incident 处理时，Agent 为不同角色（网络/数据库/应用）生成不同的视图

### 3.2 交互示例

```
告警触发 → Agent 收到 alert 事件
→ 查询 CMDB 获取服务拓扑
→ 生成 AIR-UI:

{
  "root": {
    "type": "Column",
    "children": [
      { "type": "AlertBanner", "props": {"level": "P1", "message": "DB连接池耗尽"} },
      { "type": "TopologyGraph", "props": {"data": "@state.topology", "highlight": "@state.faultNodes"} },
      { "type": "Timeline", "props": {"events": "@state.incidentTimeline"} }
    ]
  }
}

SRE 点击故障节点 → emit("investigate", {node: "db-master-03"})
→ Agent 自动拉取该节点指标、日志摘要
→ patch 补充右侧面板
```

### 3.3 为什么 AIR-UI 适合

- **时效性**：patch 机制让界面更新延迟 < 30ms，满足运维对实时性的要求
- **信息密度自适应**：Agent 根据 incident 严重程度动态调整界面复杂度，P0 只显示核心信息
- **操作闭环**：`call` 动作可直接触发扩容、重启、流量切换等运维操作（白名单控制）

---

## 4. 企业内部低代码平台

### 4.1 场景描述

企业内部存在大量" CRUD + 审批流"应用（OA、报销、资产管理）。传统低代码平台（如钉钉宜搭、Retool）本质上是**拖拽式编程**，学习成本依然不低。

AIR-UI Agent 让**业务人员用自然语言构建应用**：

```
HR: "做一个请假审批的页面，需要选日期、填理由、选审批人"
→ Agent 生成包含 Form、DatePicker、TextArea、UserPicker 的 AIR-UI 文档
→ 自动绑定审批流的 emit 事件
```

### 4.2 核心场景

| 子场景 | 用户输入 | Agent 输出 |
|-------|---------|-----------|
| 表单生成 | "新建一个客户录入表，包含公司名、联系人、行业标签" | Form 组件 + Input/Select/TagInput |
| 列表页 | "做一个合同台账，能按状态筛选、按金额排序" | Table + FilterBar + SortHeader |
| 审批流 | "超过1万的要二级审批" | 动态显示审批节点 + 条件分支 |
| 数据联动 | "选了省份后自动加载城市" | emit("provinceChange") → Agent patch 城市列表 |

### 4.3 与传统低代码对比

```
传统低代码:  用户 → 拖拽组件 → 配置属性 → 绑定数据源 → 预览
AIR-UI Agent: 用户 → 描述需求 → Agent 生成界面 → 自然语言修改 → 即时生效
```

---

## 5. 教育与自适应学习

### 5.1 场景描述

每个学生的学习路径不同。固定课程体系无法做到因材施教。AIR-UI Agent 可以构建**自适应学习界面**：

- **知识图谱可视化**：Agent 根据学生当前掌握情况，动态生成知识图谱，标注薄弱节点
- **互动练习生成**：根据错题模式，Agent 实时生成针对性练习题（填空、选择、拖拽排序等）
- **学习路径调整**：当连续答错时，Agent emit `struggle` 事件，自动降低难度或插入讲解视频

### 5.2 交互循环

```
1. 学生进入 → Agent 生成初始评估界面（AIR-UI Form）
2. 学生作答 → emit("answer", {questionId, answer})
3. Agent 推理:
   - 正确 → patch: 显示鼓励 + 推进到下一知识点
   - 错误 → patch: 显示解析 + 生成关联练习
   - 连续错误 → patch: 插入视频讲解组件
4. 学习过程中，界面持续通过 patch 演化，始终匹配学生当前水平
```

---

## 6. 医疗临床辅助

### 6.1 场景描述

临床医生需要在短时间内综合大量信息（病历、检验报告、影像描述、指南）。AIR-UI Agent 构建**患者画像动态看板**：

- **结构化病历展示**：根据病种，Agent 自动组织关键指标的时间线
- **异常高亮与归因**：检验结果异常时，Agent 标注异常项并关联可能病因
- **指南推荐**：根据患者特征，Agent 推送相关临床指南摘要

### 6.2 交互示例

```
医生: "调一下这个患者近3个月的糖化血红蛋白趋势"
→ Agent 查询 EMR 系统 → 生成 Chart(type=line, data=HbA1c趋势)
→ 自动叠加正常范围参考线
→ 识别到持续升高 → patch 插入 AlertBanner("HbA1c 持续升高，建议调整用药方案")
```

### 6.3 安全考量

- `call` 动作白名单严格限制：只能触发查询和展示，不能直接修改医嘱
- 所有 Agent 推荐内容标注置信度和信息来源
- 关键操作（如诊断建议）需医生确认 `emit("confirm")` 后才持久化

---

## 7. 客服与工单处理

### 7.1 场景描述

高级客服（或客服 supervisor）需要快速理解客户问题、查阅知识库、查看历史工单、执行操作（退款、换货）。AIR-UI Agent 构建**上下文感知的工作台**：

```
客户进线 → Agent 自动生成该客户的360°视图:
- 客户信息卡片
- 历史订单时间线
- 当前咨询意图摘要（由 LLM 实时分析对话生成）
- 推荐操作按钮（退款、补发、升级等）
```

### 7.2 关键交互

- 客户消息到达 → Agent 分析意图 → patch 更新"当前问题"面板 + 推荐话术
- 客服点击"退款" → emit("refund", {orderId}) → Agent 调用内部 API → patch 更新状态
- 工单升级 → Agent 自动补充上下文摘要给二级客服

---

## 8. 创意设计工具

### 8.1 场景描述

设计师和非设计师都需要快速产出视觉内容（社交媒体图、PPT、海报）。AIR-UI Agent 将设计过程转化为对话：

```
用户: "做一张618促销的海报，主色调红色，突出5折优惠"
→ Agent 生成 AIR-UI 文档:
{
  "root": {
    "type": "Canvas",
    "props": {"width": 800, "height": 1200, "background": "#E53935"},
    "children": [
      {"type": "Text", "props": {"value": "618", "style": "display-hero"}},
      {"type": "Text", "props": {"value": "全场5折", "style": "headline"}},
      {"type": "Image", "props": {"src": "prompt:product-placeholder"}}
    ]
  }
}

用户: "标题再大一点，金色"
→ patch: [{op: "replace", path: "/root/children/1/props/style", value: "headline-gold-xl"}]
```

### 8.2 为什么可行

- AIR-UI 的组件模型天然支持视觉布局（Column/Row/Grid/Canvas）
- `style` 属性可以是语义化的（如 `"headline-gold-xl"`），由渲染器映射到具体视觉样式
- 渐进式修改通过 patch 实现，无需重新生成

---

## 9. 游戏与互动叙事

### 9.1 场景描述

文字冒险/视觉小说/互动叙事类游戏的核心是**分支叙事 + 界面反馈**。AIR-UI Agent 可以实时生成游戏界面：

```
玩家选择 → Agent 推进剧情 → 生成新场景的 AIR-UI 界面
→ 场景包含：背景图、角色对话、选项按钮、状态栏

玩家: "打开背包" 
→ emit("openInventory") 
→ Agent patch: 插入 InventoryPanel 组件
```

### 9.2 独特价值

- **无限叙事**：每个玩家的选择都由 LLM 实时推理后续剧情，不受预制脚本限制
- **界面自适应**：战斗场景显示 HP 条 + 技能按钮，对话场景显示立绘 + 文字框，探索场景显示地图
- **低 Token 成本**：patch 机制让场景切换只需输出变化部分

---

## 10. IoT 与智能家居控制

### 10.1 场景描述

智能家居/IoT 管理的核心问题是**设备多样、场景复杂**。固定面板无法覆盖所有组合。AIR-UI Agent 根据用户当前场景动态生成控制面板：

```
用户: "我准备睡觉了"
→ Agent 推理: 关灯、调低空调、锁门、设置闹钟
→ 生成确认面板:
{
  "root": {
    "type": "Column",
    "children": [
      {"type": "Text", "props": {"value": "睡眠模式"}},
      {"type": "DeviceList", "props": {"actions": [
        {"device": "客厅灯", "action": "关"},
        {"device": "空调", "action": "26°C"},
        {"device": "门锁", "action": "上锁"}
      ]}},
      {"type": "Button", "props": {"label": "确认执行"}, "on": {"click": {"action": "call", "function": "executeScene"}}}
    ]
  }
}
```

---

## 11. 项目管理与协作

### 11.1 场景描述

项目经理需要根据项目阶段动态切换视图：甘特图、看板、燃尽图、风险矩阵。AIR-UI Agent 根据对话上下文自动切换和定制：

```
PM: "这个迭代的进度怎么样"
→ Agent 生成: 燃尽图 + 剩余任务列表 + 风险提示

PM: "把阻塞的任务标红，发给负责人"
→ Agent patch: 高亮阻塞项 + emit("notify", {users: [...], message: "..."})

PM: "切换到看板视图"
→ Agent 重新生成 Kanban 布局（而非在现有页面上打 patch）
```

---

## 12. 跨领域共性与架构模式

### 12.1 通用 Agent 循环

所有场景共享同一个核心循环：

```
┌─────────────────────────────────────────────────────┐
│                    AIR-UI Agent                      │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐   │
│  │ 事件监听  │───→│ LLM 推理  │───→│ AIR-UI 输出  │   │
│  │(emit/    │    │(上下文+   │    │(完整文档或   │   │
│  │ call/    │    │ 工具调用)  │    │ patch)       │   │
│  │ timer)   │    │          │    │              │   │
│  └──────────┘    └──────────┘    └──────────────┘   │
│       ↑                                  ↓          │
│  ┌──────────┐                    ┌──────────────┐   │
│  │ 渲染器    │←───────────────────│ AIR-UI 运行时 │   │
│  │(React/   │                    │(状态管理+     │   │
│  │ RN/...)  │                    │ Patch引擎)    │   │
│  └──────────┘                    └──────────────┘   │
│       ↑↓                                            │
│    用户交互                                          │
└─────────────────────────────────────────────────────┘
```

### 12.2 各领域能力需求矩阵

| 领域 | 核心组件 | 关键事件 | Patch 频率 | 安全等级 |
|------|---------|---------|-----------|---------|
| 金融交易 | Chart, Table, DepthMap | drilldown, trade, alert | 极高（毫秒级） | ★★★★★ |
| 企业 BI | Chart, Table, Filter | drilldown, export, share | 中（秒级） | ★★★ |
| 运维监控 | TopologyGraph, Timeline, LogViewer | investigate, scale, rollback | 高（秒级） | ★★★★ |
| 低代码平台 | Form, Table, FlowChart | submit, approve, route | 低（用户触发） | ★★★ |
| 教育 | KnowledgeMap, Quiz, Video | answer, hint, struggle | 中（题目级） | ★★ |
| 医疗 | Timeline, LabResult, Guideline | alert, confirm, reference | 中 | ★★★★★ |
| 客服 | CustomerCard, OrderTimeline | refund, escalate, resolve | 中 | ★★★ |
| 创意设计 | Canvas, Text, Image, Shape | adjust, export, iterate | 高（实时预览） | ★ |
| 游戏 | Scene, DialogBox, StatusBar | choice, inventory, combat | 高（场景切换） | ★ |
| IoT | DeviceCard, ScenePanel | execute, schedule, alert | 低（用户触发） | ★★★★ |
| 项目管理 | Gantt, Kanban, Burndown | notify, assign, escalate | 低 | ★★ |

### 12.3 AIR-UI 的不可替代性

为什么这些场景用"HTML + JS"传统方案做不到？

1. **Token 效率**：LLM 输出 HTML + CSS + JS 来描述一个中等复杂度看板可能需要 3000+ tokens；等价 AIR-UI 文档只需 800- tokens，且结构确定性更高
2. **状态即文档**：AIR-UI 的 `state` 挂载在根对象上，LLM 不需要维护隐式的 DOM 状态
3. **意图级事件**：`emit("drilldown")` vs `onClick`，前者 LLM 可直接理解并推理下一步动作
4. **增量更新**：patch 机制让交互循环的响应时间从"重新生成整个页面"降至"只输出变化部分"
5. **跨平台一致性**：同一份 AIR-UI 文档可渲染到 Web、RN、小程序、甚至终端 TUI

---

## 13. 实施优先级建议

基于 **市场价值 × 技术可行性** 矩阵：

| 优先级 | 领域 | 理由 |
|-------|------|------|
| **P0** | 金融交易终端 | 已有 TDX/KPL MCP 工具链，数据源就绪；高频场景验证 patch 性能 |
| **P0** | 企业数据看板/BI | 需求最普遍；组件复用度高（Chart + Table + Filter） |
| **P1** | 运维监控 | 实时性要求高，能充分验证 AIR-UI 的 patch 优势 |
| **P1** | 低代码平台 | 企业付费意愿强；可沉淀为 SaaS 产品 |
| **P2** | 客服工单 | 场景相对简单，适合早期商业化 |
| **P2** | 项目管理 | 界面模式成熟（Kanban/Gantt），实现难度适中 |
| **P3** | 创意设计 | 需要丰富的 Canvas 组件支持，技术难度较高 |
| **P3** | 教育 | 互动模式多，需要沉淀大量学科知识模板 |
| **P4** | 游戏 | 探索性方向，适合作为技术展示 |
| **P4** | IoT | 设备生态复杂，需要硬件层适配 |
| **P4** | 医疗 | 合规要求高，适合后期切入 |

---

## 14. 总结

AIR-UI 的本质是将 **UI 的生产和消费过程重新定义为 LLM 可直接参与的 IO 协议**。这不仅仅是"用 AI 生成界面"，而是建立一个闭环：

```
自然语言/事件 → LLM 推理 → 结构化 UI (AIR-UI) → 渲染 → 用户交互 → 事件 → LLM 推理 → ...
```

在这个闭环中，UI 不再是静态的产品，而是 **LLM 和人类协作的动态媒介**。任何"信息密集 + 交互频繁 + 需求多变"的场景，都是 AIR-UI Agent 的潜在战场。

---

**文档结束**
