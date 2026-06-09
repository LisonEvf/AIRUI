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

  return <div style={{ color: "var(--air-danger)", fontSize: 12 }}>{"Unknown: "}{comp.type}</div>;
};
