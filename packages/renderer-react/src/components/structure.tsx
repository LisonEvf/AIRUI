import { type FC, useState, useRef, useCallback, useEffect } from "react";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";
import { AirUIComponent } from "./engine";

// ─── Dashboard ─────────────────────────────────────

const gapMap: Record<string, string> = { small: "12px", medium: "20px", large: "32px" };

export const Dashboard: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const columns = (resolvedProps.columns as number) ?? 3;
  const gap = gapMap[(resolvedProps.gap as string) ?? "medium"] ?? "20px";
  const { emit } = useComponentEvents(comp);
  const resizeRef = useRef<{ ref: string; startColSpan: number; startRowSpan: number; startX: number; startY: number } | null>(null);
  const [spans, setSpans] = useState<Record<string, { colSpan: number; rowSpan: number }>>({});

  useEffect(() => {
    const init: Record<string, { colSpan: number; rowSpan: number }> = {};
    comp.children?.forEach((child) => { const p = child.props ?? {}; if (child.ref) init[child.ref] = { colSpan: (p.colSpan as number) ?? 1, rowSpan: (p.rowSpan as number) ?? 1 }; });
    if (Object.keys(init).length > 0) setSpans(init);
  }, [comp.children]);

  const handleMouseDown = useCallback((e: React.MouseEvent, childRef: string) => {
    e.preventDefault();
    const cur = spans[childRef] ?? { colSpan: 1, rowSpan: 1 };
    resizeRef.current = { ref: childRef, startColSpan: cur.colSpan, startRowSpan: cur.rowSpan, startX: e.clientX, startY: e.clientY };
    const move = (ev: MouseEvent) => { if (!resizeRef.current) return; const dCol = Math.round((ev.clientX - resizeRef.current.startX) / 160); const dRow = Math.round((ev.clientY - resizeRef.current.startY) / 120); setSpans((p) => ({ ...p, [resizeRef.current!.ref]: { colSpan: Math.max(1, Math.min(columns, resizeRef.current.startColSpan + dCol)), rowSpan: Math.max(1, Math.min(6, resizeRef.current.startRowSpan + dRow)) } })); };
    const up = () => { if (resizeRef.current) { const f = spans[resizeRef.current.ref]; if (f && (f.colSpan !== resizeRef.current.startColSpan || f.rowSpan !== resizeRef.current.startRowSpan)) emit("resize", { colSpan: f.colSpan, rowSpan: f.rowSpan }); } resizeRef.current = null; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  }, [spans, columns, emit]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
      {comp.children?.map((child, i) => {
        const cp = child.props ?? {}; const ref = child.ref ?? `c-${i}`;
        const span = spans[ref] ?? { colSpan: (cp.colSpan as number) ?? 1, rowSpan: (cp.rowSpan as number) ?? 1 };
        return (
          <div key={ref} style={{ gridColumn: `span ${span.colSpan}`, gridRow: `span ${span.rowSpan}`, position: "relative", minHeight: 100 }}>
            {child.type === "Widget" ? <Widget comp={child} /> : <AirUIComponent comp={child} />}
            <div onMouseDown={(e) => handleMouseDown(e, ref)} style={{ position: "absolute", right: 4, bottom: 4, width: 20, height: 20, cursor: "nwse-resize", zIndex: 10, opacity: 0, transition: "opacity 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0"; }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="9" cy="9" r="1.2" fill="var(--air-textMuted)" /><circle cx="9" cy="5.5" r="1.2" fill="var(--air-textMuted)" /><circle cx="5.5" cy="9" r="1.2" fill="var(--air-textMuted)" /></svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Widget ────────────────────────────────────────

export const Widget: FC<{ comp: Component }> = ({ comp }) => {
  const props = comp.props ?? {};
  const title = props.title as string | undefined;
  const loading = props.loading as boolean | false;
  const widgetRef = (comp.ref as string) ?? "";
  const dataIntent = comp.dataIntent as { refreshInterval?: number } | undefined;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hovered, setHovered] = useState(false);
  const { emit } = useComponentEvents(comp);

  useEffect(() => {
    const interval = dataIntent?.refreshInterval;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (widgetRef && interval && interval >= 1000) { timerRef.current = setInterval(() => emit("refresh", {}), interval); }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [dataIntent?.refreshInterval, widgetRef, emit]);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ border: "1px solid var(--air-border)", borderRadius: 14, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column", background: "var(--air-surface)", boxShadow: hovered ? "var(--air-shadowHover)" : "var(--air-shadow)", transition: "box-shadow 0.25s, border-color 0.25s" }}>
      {title && (
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--air-borderLight)", fontWeight: 600, fontSize: 13, letterSpacing: "-0.01em", display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--air-text)" }}>
          <span>{title}</span>
          {loading && <div style={{ width: 14, height: 14, border: "2px solid var(--air-border)", borderTopColor: "var(--air-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
        </div>
      )}
      <div style={{ flex: 1, padding: 16, overflow: "auto" }}>{comp.children?.map((child, i) => <AirUIComponent key={child.ref ?? i} comp={child} />)}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── Accordion ─────────────────────────────────────

interface AccItem { key: string; title: string }

export const Accordion: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const items = (resolvedProps.items as AccItem[]) ?? [];
  const defaultActive = (resolvedProps.active as string[]) ?? [];
  const single = resolvedProps.single as boolean | false;
  const { emit } = useComponentEvents(comp);
  const [activeKeys, setActiveKeys] = useState<string[]>(defaultActive);

  const toggle = (key: string) => {
    const next = activeKeys.includes(key) ? activeKeys.filter((k) => k !== key) : single ? [key] : [...activeKeys, key];
    setActiveKeys(next);
    emit("toggle", { activeKeys: next, toggled: key });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item, idx) => { const isOpen = activeKeys.includes(item.key); return (
        <div key={item.key} style={{ borderBottom: "1px solid var(--air-borderLight)" }}>
          <div onClick={() => toggle(item.key)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 4px", cursor: "pointer", userSelect: "none" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--air-text)" }}>{item.title}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--air-textMuted)" strokeWidth="2" strokeLinecap="round" style={{ transform: `rotate(${isOpen ? 180 : 0}deg)`, transition: "transform 0.2s" }}><path d="M4 6l4 4 4-4" /></svg>
          </div>
          {isOpen && comp.children?.[idx] && <div style={{ paddingBottom: 14 }}><AirUIComponent comp={comp.children[idx]} /></div>}
        </div>
      ); })}
    </div>
  );
};

// ─── Timeline ──────────────────────────────────────

interface TLItem { key: string; title: string; description?: string; time?: string; color?: string }

const dotColors: Record<string, string> = { accent: "var(--air-accent)", success: "var(--air-success)", danger: "var(--air-danger)", warning: "var(--air-warning)" };

export const Timeline: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const items = (resolvedProps.items as TLItem[]) ?? [];
  const { emit } = useComponentEvents(comp);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item, i) => { const last = i === items.length - 1; const dc = dotColors[item.color ?? "accent"] ?? "var(--air-accent)"; return (
        <div key={item.key} onClick={() => emit("click", { key: item.key, index: i })} style={{ display: "flex", gap: 16, cursor: "pointer", paddingBottom: last ? 0 : 20, position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: dc, border: "2px solid var(--air-surface)", boxShadow: `0 0 0 2px ${dc}`, flexShrink: 0, zIndex: 1 }} />
            {!last && <div style={{ width: 2, flex: 1, background: "var(--air-borderLight)", marginTop: 4 }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--air-text)" }}>{item.title}</div>
            {item.description && <div style={{ fontSize: 13, color: "var(--air-textSecondary)", marginTop: 2, lineHeight: 1.5 }}>{item.description}</div>}
            {item.time && <div style={{ fontSize: 12, color: "var(--air-textMuted)", marginTop: 4 }}>{item.time}</div>}
          </div>
        </div>
      ); })}
    </div>
  );
};

// ─── Tree ──────────────────────────────────────────

interface TreeNode { key: string; label: string; children?: TreeNode[] }

function TreeNodeItem({ node, compRef, depth }: { node: TreeNode; compRef: string; depth: number }) {
  const hasCh = node.children && node.children.length > 0;
  const [expanded, setExpanded] = useState(false);
  const { emit } = useComponentEvents({ ref: compRef } as Component);
  return (
    <div>
      <div onClick={() => { if (hasCh) setExpanded(!expanded); emit("click", { key: node.key }); }}
        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 8px", paddingLeft: depth * 20 + 8, borderRadius: 6, cursor: "pointer", fontSize: 13, color: "var(--air-text)", transition: "background 0.1s", userSelect: "none" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--air-surfaceAlt)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
        {hasCh ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--air-textMuted)" strokeWidth="2" strokeLinecap="round" style={{ transform: `rotate(${expanded ? 90 : 0}deg)`, transition: "transform 0.15s", flexShrink: 0 }}><path d="M5 3l3 3-3 3" /></svg> : <span style={{ width: 12, flexShrink: 0 }} />}
        <span style={{ fontWeight: hasCh ? 600 : 400 }}>{node.label}</span>
      </div>
      {hasCh && expanded && node.children!.map((c) => <TreeNodeItem key={c.key} node={c} compRef={compRef} depth={depth + 1} />)}
    </div>
  );
}

export const Tree: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const data = (resolvedProps.data as TreeNode[]) ?? [];
  return <div style={{ padding: "4px 0" }}>{data.map((n) => <TreeNodeItem key={n.key} node={n} compRef={comp.ref ?? "tree"} depth={0} />)}</div>;
};
