import { type FC, useState } from "react";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";
import { AirUIComponent } from "./engine";

interface NavItem {
  key: string;
  label: string;
  href?: string;
  icon?: string;
  active?: boolean;
  disabled?: boolean;
}

function normalizeNavItems(value: unknown): NavItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const nav = typeof item === "string" ? { key: item, label: item } : item as Partial<NavItem>;
    return { key: String(nav.key ?? nav.label ?? ""), label: String(nav.label ?? nav.key ?? ""), href: nav.href, icon: nav.icon, active: nav.active, disabled: nav.disabled };
  }).filter((item) => item.key);
}

export const AppShell: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const sidebar = comp.slots?.sidebar;
  const header = comp.slots?.header ?? comp.slots?.top;
  const footer = comp.slots?.footer;
  const sidebarWidth = (resolvedProps.sidebarWidth as number | string | undefined) ?? 260;

  return (
    <div style={{ minHeight: (resolvedProps.height as number | string | undefined) ?? "100%", display: "grid", gridTemplateRows: header ? "auto 1fr auto" : "1fr auto", background: "var(--air-surface)", color: "var(--air-text)", border: "1px solid var(--air-border)", borderRadius: 10, overflow: "hidden" }}>
      {header && <div style={{ borderBottom: "1px solid var(--air-border)" }}><AirUIComponent comp={header} /></div>}
      <div style={{ display: "grid", gridTemplateColumns: sidebar ? `${typeof sidebarWidth === "number" ? `${sidebarWidth}px` : sidebarWidth} minmax(0, 1fr)` : "minmax(0, 1fr)", minHeight: 0 }}>
        {sidebar && <div style={{ minWidth: 0, borderRight: "1px solid var(--air-border)", background: "var(--air-surfaceAlt)" }}><AirUIComponent comp={sidebar} /></div>}
        <main style={{ minWidth: 0, overflow: "auto", padding: (resolvedProps.padding as number | string | undefined) ?? 16 }}>
          {comp.children?.map((child, index) => <AirUIComponent key={child.ref ?? index} comp={child} />)}
        </main>
      </div>
      {footer && <div style={{ borderTop: "1px solid var(--air-border)" }}><AirUIComponent comp={footer} /></div>}
    </div>
  );
};

export const Sidebar: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const items = normalizeNavItems(resolvedProps.items);
  const title = resolvedProps.title as string | undefined;
  const [active, setActive] = useState((resolvedProps.active as string | undefined) ?? items.find((item) => item.active)?.key ?? "");
  const { emit } = useComponentEvents(comp);

  return (
    <aside style={{ height: "100%", minHeight: 0, overflow: "auto", padding: 12 }}>
      {title && <div style={{ padding: "8px 10px 12px", fontSize: 13, fontWeight: 800, color: "var(--air-textMuted)", textTransform: "uppercase" }}>{title}</div>}
      <nav style={{ display: "grid", gap: 4 }}>
        {items.map((item) => {
          const selected = item.key === active || item.active;
          return (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              onClick={() => { setActive(item.key); emit("select", { key: item.key, item }); }}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 10px", border: "none", borderRadius: 8, background: selected ? "var(--air-accentSubtle)" : "transparent", color: selected ? "var(--air-accent)" : "var(--air-text)", textAlign: "left", cursor: item.disabled ? "not-allowed" : "pointer", fontWeight: selected ? 700 : 500, opacity: item.disabled ? 0.5 : 1 }}
            >
              {item.icon && <span style={{ width: 18, textAlign: "center" }}>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      {comp.children?.map((child, index) => <AirUIComponent key={child.ref ?? index} comp={child} />)}
    </aside>
  );
};

export const TopNav: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const items = normalizeNavItems(resolvedProps.items);
  const title = resolvedProps.title as string | undefined;
  const { emit } = useComponentEvents(comp);

  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 54, padding: "0 16px", background: "var(--air-surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        {title && <strong style={{ fontSize: 15, color: "var(--air-text)", whiteSpace: "nowrap" }}>{title}</strong>}
        <nav style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, overflowX: "auto" }}>
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              onClick={() => emit("select", { key: item.key, item })}
              style={{ padding: "8px 10px", border: "none", borderRadius: 8, background: item.active ? "var(--air-accentSubtle)" : "transparent", color: item.active ? "var(--air-accent)" : "var(--air-textSecondary)", cursor: item.disabled ? "not-allowed" : "pointer", fontWeight: item.active ? 700 : 500, whiteSpace: "nowrap" }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {comp.children?.map((child, index) => <AirUIComponent key={child.ref ?? index} comp={child} />)}
      </div>
    </header>
  );
};

export const Toolbar: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const items = normalizeNavItems(resolvedProps.items);
  const { emit } = useComponentEvents(comp);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: (resolvedProps.padding as number | string | undefined) ?? 8, border: (resolvedProps.border as boolean | undefined) === false ? "none" : "1px solid var(--air-border)", borderRadius: 8, background: "var(--air-surface)" }}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          disabled={item.disabled}
          onClick={() => emit("click", { key: item.key, item })}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 10px", border: "1px solid var(--air-border)", borderRadius: 7, background: item.active ? "var(--air-accent)" : "var(--air-surfaceAlt)", color: item.active ? "#fff" : "var(--air-text)", cursor: item.disabled ? "not-allowed" : "pointer", fontWeight: 600, opacity: item.disabled ? 0.5 : 1 }}
        >
          {item.icon && <span>{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
      {comp.children?.map((child, index) => <AirUIComponent key={child.ref ?? index} comp={child} />)}
    </div>
  );
};

export const SplitPane: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const direction = (resolvedProps.direction as string) ?? "horizontal";
  const primarySize = (resolvedProps.primarySize as number | string | undefined) ?? "50%";
  const first = comp.children?.[0];
  const second = comp.children?.[1];
  const horizontal = direction !== "vertical";

  return (
    <div style={{ display: "grid", gridTemplateColumns: horizontal ? `${typeof primarySize === "number" ? `${primarySize}px` : primarySize} 1px minmax(0, 1fr)` : "1fr", gridTemplateRows: horizontal ? "1fr" : `${typeof primarySize === "number" ? `${primarySize}px` : primarySize} 1px minmax(0, 1fr)`, minHeight: (resolvedProps.height as number | string | undefined) ?? 320, border: "1px solid var(--air-border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ minWidth: 0, minHeight: 0, overflow: "auto", padding: 12 }}>{first && <AirUIComponent comp={first} />}</div>
      <div style={{ background: "var(--air-border)" }} />
      <div style={{ minWidth: 0, minHeight: 0, overflow: "auto", padding: 12 }}>{second && <AirUIComponent comp={second} />}</div>
    </div>
  );
};

export const ScrollArea: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => (
  <div style={{ maxHeight: (resolvedProps.maxHeight as number | string | undefined) ?? 320, overflow: "auto", paddingRight: 4, scrollbarGutter: "stable" }}>
    {comp.children?.map((child, index) => <AirUIComponent key={child.ref ?? index} comp={child} />)}
  </div>
);

