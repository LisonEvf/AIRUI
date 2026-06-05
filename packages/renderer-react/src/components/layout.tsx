import { type FC, type CSSProperties } from "react";
import type { Component } from "@air-ui/core";
import { AirUIComponent } from "./engine";

const gapMap: Record<string, string> = { small: "8px", medium: "16px", large: "28px" };
const alignMap: Record<string, CSSProperties["alignItems"]> = {
  start: "flex-start", center: "center", end: "flex-end", stretch: "stretch",
};

function resolveGap(gap?: string | number): string | undefined {
  if (gap === undefined) return undefined;
  if (typeof gap === "number") return `${gap}px`;
  return gapMap[gap] ?? gap;
}
function resolveAlign(align?: string): CSSProperties["alignItems"] | undefined {
  return align ? (alignMap[align] ?? align) : undefined;
}

export const Column: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => (
  <div style={{
    display: "flex", flexDirection: "column",
    gap: resolveGap(resolvedProps.gap as string),
    padding: resolveGap(resolvedProps.padding as string),
    alignItems: resolveAlign(resolvedProps.align as string),
  }}>
    {comp.children?.map((child, i) => <AirUIComponent key={child.ref ?? i} comp={child} />)}
  </div>
);

export const Row: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => (
  <div style={{
    display: "flex", flexDirection: "row",
    gap: resolveGap(resolvedProps.gap as string),
    padding: resolveGap(resolvedProps.padding as string),
    alignItems: resolveAlign(resolvedProps.align as string),
  }}>
    {comp.children?.map((child, i) => <AirUIComponent key={child.ref ?? i} comp={child} />)}
  </div>
);

export const Divider: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const label = resolvedProps.label as string | undefined;
  const direction = (resolvedProps.direction as string) ?? "horizontal";

  if (direction === "vertical") {
    return <div style={{ display: "inline-block", width: 1, height: 20, background: "var(--air-border)", margin: "0 12px", verticalAlign: "middle" }} />;
  }
  if (label) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--air-border)" }} />
        <span style={{ fontSize: 12, color: "var(--air-textMuted)", fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: "var(--air-border)" }} />
      </div>
    );
  }
  return <div style={{ height: 1, background: "var(--air-borderLight)", margin: "12px 0" }} />;
};
