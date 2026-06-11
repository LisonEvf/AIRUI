import { type FC } from "react";
import type { Component } from "@air-ui/core";
import { useAirUIStore } from "../store";
import { getRegisteredComponent } from "../registry";
import { resolveProps } from "../resolve";
import { Column, Row, Divider } from "./layout";
import { Text } from "./typography";
import { Button, Input, Select, Switch, Checkbox, Radio, Slider, Image, Dropdown } from "./form";
import { Form, Textarea, DatePicker, TimePicker, DateRangePicker, NumberInput, Autocomplete, MultiSelect, FileUpload } from "./advanced-form";
import { Video, Audio, ImageGallery, Carousel, Lightbox, PDFViewer } from "./media";
import { KPI, PlateCard, Gauge, Progress, Tag, Badge, Avatar, Skeleton } from "./data-display";
import { Table, Pagination } from "./data-table";
import { DataGrid, EmptyState } from "./data-workbench";
import { Chart } from "./chart";
import { Tabs, Breadcrumb, Steps } from "./navigation";
import { Modal, Drawer, DropdownMenu } from "./overlay";
import { Alert, Loading, ErrorFallback, Tooltip, Toast, Notification, Popconfirm, ContextMenu, CommandPalette } from "./feedback";
import { Dashboard, Widget, Accordion, Timeline, Tree } from "./structure";
import { AppShell, Sidebar, TopNav, Toolbar, SplitPane, ScrollArea } from "./app-shell";
import { Markdown, CodeBlock, RichText, Icon } from "./content";
import { Calendar, Kanban, Map, NetworkGraph, Heatmap } from "./domain-views";

const builtinMap: Record<string, FC<{ comp: Component; resolvedProps: Record<string, unknown> }>> = {
  Column, Row, Divider, Text, Button, Input, Select, Switch, Checkbox, Radio, Slider, Image, Dropdown,
  Form, Textarea, DatePicker, TimePicker, DateRangePicker, NumberInput, Autocomplete, MultiSelect, FileUpload,
  Video, Audio, ImageGallery, Carousel, Lightbox, PDFViewer,
  KPI, PlateCard, Gauge, Progress, Tag, Badge, Avatar, Skeleton,
  Table, Pagination, DataGrid, EmptyState, Chart,
  Tabs, Breadcrumb, Steps,
  Modal, Drawer, DropdownMenu,
  Alert, ErrorFallback, Tooltip, Toast, Notification, Popconfirm, ContextMenu, CommandPalette,
  Dashboard, Widget, Accordion, Timeline, Tree, AppShell, Sidebar, TopNav, Toolbar, SplitPane, ScrollArea,
  Markdown, CodeBlock, RichText, Icon,
  Calendar, Kanban, Map, NetworkGraph, Heatmap,
};

// 未知类型优雅兜底：LLM 输出词汇表外的组件时不再红字报错，
// 尽力以通用容器渲染 children / 文本类 props，保证动态 UI 永不烂脸。
const UnknownFallback: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const textLike = ["label", "value", "title", "text", "content"]
    .map((key) => resolvedProps[key])
    .find((v) => typeof v === "string" || typeof v === "number");
  const hasChildren = (comp.children?.length ?? 0) > 0;
  if (!hasChildren && textLike == null) {
    return <span data-air-unknown={comp.type} style={{ display: "none" }} />;
  }
  return (
    <div data-air-unknown={comp.type} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {textLike != null && <span style={{ fontSize: "1rem", lineHeight: 1.6, color: "var(--air-text)" }}>{String(textLike)}</span>}
      {comp.children?.map((child, i) => (
        <AirUIComponent key={child.ref ?? i} comp={child} />
      ))}
    </div>
  );
};

export const AirUIComponent: FC<{ comp: Component }> = ({ comp }) => {
  const doc = useAirUIStore((s) => s.doc);
  if (!doc) return null;

  const resolvedProps = resolveProps(comp.props ?? {}, doc.state);

  if (comp.type === "Loading") return <Loading />;
  if (comp.type === "Widget") return <Widget comp={comp} />;

  const CustomRenderer = getRegisteredComponent(comp.type);
  if (CustomRenderer) {
    const C = CustomRenderer as FC<{ comp: Component; resolvedProps: Record<string, unknown> }>;
    return <C comp={comp} resolvedProps={resolvedProps} />;
  }

  const Builtin = builtinMap[comp.type];
  if (Builtin) return <Builtin comp={comp} resolvedProps={resolvedProps} />;

  return <UnknownFallback comp={comp} resolvedProps={resolvedProps} />;
};
