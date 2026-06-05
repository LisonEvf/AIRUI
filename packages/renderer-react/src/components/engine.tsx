import { type FC } from "react";
import type { Component } from "@air-ui/core";
import { useAirUIStore } from "../store";
import { getRegisteredComponent } from "../registry";
import { resolveProps } from "../resolve";
import { Column, Row, Divider } from "./layout";
import { Text } from "./typography";
import { Button, Input, Select, Switch, Checkbox, Radio, Slider, Image, Dropdown } from "./form";
import { KPI, PlateCard, Gauge, Progress, Tag, Badge, Avatar, Skeleton } from "./data-display";
import { Table, Pagination } from "./data-table";
import { Chart } from "./chart";
import { Tabs, Breadcrumb, Steps } from "./navigation";
import { Modal, Drawer, DropdownMenu } from "./overlay";
import { Alert, Loading, ErrorFallback, Tooltip } from "./feedback";
import { Dashboard, Widget, Accordion, Timeline, Tree } from "./structure";

const builtinMap: Record<string, FC<{ comp: Component; resolvedProps: Record<string, unknown> }>> = {
  Column, Row, Divider, Text, Button, Input, Select, Switch, Checkbox, Radio, Slider, Image, Dropdown,
  KPI, PlateCard, Gauge, Progress, Tag, Badge, Avatar, Skeleton,
  Table, Pagination, Chart,
  Tabs, Breadcrumb, Steps,
  Modal, Drawer, DropdownMenu,
  Alert, ErrorFallback, Tooltip,
  Dashboard, Widget, Accordion, Timeline, Tree,
};

export const AirUIComponent: FC<{ comp: Component }> = ({ comp }) => {
  const doc = useAirUIStore((s) => s.doc);
  if (!doc) return null;

  const resolvedProps = resolveProps(comp.props ?? {}, doc.state);

  // Special: Loading has no props to resolve
  if (comp.type === "Loading") return <Loading />;
  // Widget is special: takes raw comp, not resolvedProps
  if (comp.type === "Widget") return <Widget comp={comp} />;

  // Custom registry first
  const custom = getRegisteredComponent(comp.type);
  if (custom) return <custom comp={comp} resolvedProps={resolvedProps} />;

  // Built-in
  const Builtin = builtinMap[comp.type];
  if (Builtin) return <Builtin comp={comp} resolvedProps={resolvedProps} />;

  return <div style={{ color: "var(--air-danger)", fontSize: 12 }}>Unknown: {comp.type}</div>;
};
