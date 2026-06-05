import { type FC, useState } from "react";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";
import { AirUIComponent } from "./engine";

// ─── Tabs ──────────────────────────────────────────

interface TabItem { key: string; label: string }

export const Tabs: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const tabs = (resolvedProps.tabs as TabItem[]) ?? [];
  const defaultActive = (resolvedProps.active as string) ?? tabs[0]?.key;
  const [active, setActive] = useState(defaultActive);
  const { emit } = useComponentEvents(comp);

  const activeChildren = (() => {
    if (Array.isArray(comp.children)) { const idx = tabs.findIndex((t) => t.key === active); return idx >= 0 ? [comp.children[idx]] : []; }
    return comp.children ? [comp.children] : [];
  })();

  return (
    <div>
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--air-border)", marginBottom: 20 }}>
        {tabs.map((tab) => { const isA = active === tab.key; return (
          <div key={tab.key} onClick={() => { setActive(tab.key); emit("select", { tab: tab.key }); }}
            style={{ padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: isA ? 600 : 400, color: isA ? "var(--air-text)" : "var(--air-textSecondary)", borderBottom: isA ? "2px solid var(--air-accent)" : "2px solid transparent", marginBottom: -1, transition: "color 0.15s, border-color 0.15s", letterSpacing: "-0.01em" }}
            onMouseEnter={(e) => { if (!isA) e.currentTarget.style.color = "var(--air-text)"; }}
            onMouseLeave={(e) => { if (!isA) e.currentTarget.style.color = "var(--air-textSecondary)"; }}
          >{tab.label}</div>
        ); })}
      </div>
      <div>{activeChildren.map((child: any, i: number) => <AirUIComponent key={child.ref ?? i} comp={child} />)}</div>
    </div>
  );
};

// ─── Breadcrumb ────────────────────────────────────

interface BCItem { key: string; label: string }

export const Breadcrumb: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const items = (resolvedProps.items as BCItem[]) ?? [];
  const { emit } = useComponentEvents(comp);
  return (
    <nav style={{ display: "flex", alignItems: "center", fontSize: 13 }}>
      {items.map((item, i) => { const last = i === items.length - 1; return (
        <span key={item.key} style={{ display: "flex", alignItems: "center" }}>
          <span onClick={() => { if (!last) emit("click", { key: item.key, index: i }); }}
            style={{ color: last ? "var(--air-text)" : "var(--air-textSecondary)", fontWeight: last ? 600 : 400, cursor: last ? "default" : "pointer", transition: "color 0.15s" }}
            onMouseEnter={(e) => { if (!last) e.currentTarget.style.color = "var(--air-accent)"; }}
            onMouseLeave={(e) => { if (!last) e.currentTarget.style.color = "var(--air-textSecondary)"; }}
          >{item.label}</span>
          {!last && <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--air-textMuted)" strokeWidth="2" strokeLinecap="round" style={{ margin: "0 6px", flexShrink: 0 }}><path d="M5 3l4 4-4 4" /></svg>}
        </span>
      ); })}
    </nav>
  );
};

// ─── Steps ─────────────────────────────────────────

interface StepItem { key: string; title: string; description?: string }

export const Steps: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const items = (resolvedProps.items as StepItem[]) ?? [];
  const current = Number(resolvedProps.current ?? 0);
  const { emit } = useComponentEvents(comp);

  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      {items.map((item, i) => { const done = i < current; const isCurr = i === current;
        return (
          <div key={item.key} onClick={() => emit("click", { step: i })} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%", marginBottom: 8 }}>
              {i > 0 && <div style={{ flex: 1, height: 2, background: done ? "var(--air-accent)" : "var(--air-borderLight)" }} />}
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${done || isCurr ? "var(--air-accent)" : "var(--air-border)"}`, background: done ? "var(--air-accent)" : isCurr ? "var(--air-accentSubtle)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: done ? "#fff" : isCurr ? "var(--air-accent)" : "var(--air-textMuted)", flexShrink: 0, transition: "all 0.2s" }}>
                {done ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5" /></svg> : i + 1}
              </div>
              {i < items.length - 1 && <div style={{ flex: 1, height: 2, background: done ? "var(--air-accent)" : "var(--air-borderLight)" }} />}
            </div>
            <div style={{ fontSize: 13, fontWeight: isCurr ? 600 : 400, color: isCurr ? "var(--air-accent)" : done ? "var(--air-text)" : "var(--air-textMuted)", textAlign: "center" }}>{item.title}</div>
            {item.description && <div style={{ fontSize: 11, color: "var(--air-textMuted)", marginTop: 2, textAlign: "center" }}>{item.description}</div>}
          </div>
        );
      })}
    </div>
  );
};
