import { type FC, useMemo, useState } from "react";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";
import { AirUIComponent } from "./engine";

// ─── Alert ─────────────────────────────────────────

const alertConfig: Record<string, { bg: string; text: string; icon: string }> = {
  info: { bg: "var(--air-accentSubtle)", text: "var(--air-accent)", icon: "ℹ" },
  success: { bg: "var(--air-successBg)", text: "var(--air-success)", icon: "✓" },
  warning: { bg: "var(--air-warningBg)", text: "var(--air-warning)", icon: "⚠" },
  danger: { bg: "var(--air-dangerBg)", text: "var(--air-danger)", icon: "✕" },
};

export const Alert: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const message = (resolvedProps.message as string) ?? (resolvedProps.value as string) ?? "";
  const description = resolvedProps.description as string | undefined;
  const type = (resolvedProps.type as string) ?? "info";
  const c = alertConfig[type] ?? alertConfig.info;
  return (
    <div style={{ display: "flex", gap: 12, padding: "14px 18px", borderRadius: 10, background: c.bg, border: `1px solid ${c.text}`, borderWidth: 1, borderLeftWidth: 3 }}>
      <span style={{ color: c.text, fontSize: 16, fontWeight: 700, lineHeight: "20px", flexShrink: 0 }}>{c.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.text, lineHeight: 1.4 }}>{message}</div>
        {description && <div style={{ fontSize: 13, color: c.text, opacity: 0.8, marginTop: 4, lineHeight: 1.5 }}>{description}</div>}
      </div>
    </div>
  );
};

// ─── Loading ───────────────────────────────────────

export const Loading: FC = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, gap: 10 }}>
    <div style={{ width: 20, height: 20, border: "2.5px solid var(--air-border)", borderTopColor: "var(--air-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <span style={{ fontSize: 14, color: "var(--air-textMuted)", fontWeight: 500 }}>Loading...</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── ErrorFallback ─────────────────────────────────

export const ErrorFallback: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => (
  <div style={{ padding: 24, textAlign: "center", borderRadius: 12, background: "var(--air-dangerBg)", border: "1px solid var(--air-danger)" }}>
    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--air-danger)", marginBottom: 4 }}>Something went wrong</div>
    <div style={{ fontSize: 13, color: "var(--air-danger)", opacity: 0.8 }}>{(resolvedProps.message as string) ?? "An unexpected error occurred"}</div>
    {!!resolvedProps.retryable && <div style={{ fontSize: 13, color: "var(--air-textMuted)", marginTop: 8 }}>Retrying...</div>}
  </div>
);

// ─── Tooltip ───────────────────────────────────────

export const Tooltip: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp }) => {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {comp.children?.[0] && <AirUIComponent comp={comp.children[0]} />}
    </div>
  );
};

interface CommandItem {
  key: string;
  label: string;
  description?: string;
  shortcut?: string;
  disabled?: boolean;
}

function feedbackColors(type: unknown) {
  const key = String(type ?? "info");
  const map: Record<string, { bg: string; text: string; border: string }> = {
    info: { bg: "var(--air-accentSubtle)", text: "var(--air-accent)", border: "var(--air-accent)" },
    success: { bg: "var(--air-successBg)", text: "var(--air-success)", border: "var(--air-success)" },
    warning: { bg: "var(--air-warningBg)", text: "var(--air-warning)", border: "var(--air-warning)" },
    danger: { bg: "var(--air-dangerBg)", text: "var(--air-danger)", border: "var(--air-danger)" },
  };
  return map[key] ?? map.info;
}

export const Toast: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const [visible, setVisible] = useState((resolvedProps.visible as boolean | undefined) ?? true);
  const { emit } = useComponentEvents(comp);
  if (!visible) return null;
  const colors = feedbackColors(resolvedProps.type);
  const message = String(resolvedProps.message ?? resolvedProps.value ?? "");
  const position = (resolvedProps.position as string | undefined) ?? "bottom-right";
  const style: React.CSSProperties = {
    position: (resolvedProps.inline as boolean | undefined) ? "relative" : "fixed",
    zIndex: 1300,
    minWidth: 220,
    maxWidth: 360,
    padding: "10px 12px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.text,
    boxShadow: "var(--air-shadowHover)",
    fontSize: 13,
    fontWeight: 700,
  };
  if (!(resolvedProps.inline as boolean | undefined)) {
    if (position.includes("bottom")) style.bottom = 16;
    if (position.includes("top")) style.top = 16;
    if (position.includes("right")) style.right = 16;
    if (position.includes("left")) style.left = 16;
  }

  return (
    <div style={style}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <span>{message}</span>
        <button type="button" onClick={() => { setVisible(false); emit("close", {}); }} style={{ border: "none", background: "transparent", color: "currentColor", cursor: "pointer", fontWeight: 900 }}>x</button>
      </div>
    </div>
  );
};

export const Notification: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const [visible, setVisible] = useState((resolvedProps.visible as boolean | undefined) ?? true);
  const { emit } = useComponentEvents(comp);
  if (!visible) return null;
  const colors = feedbackColors(resolvedProps.type);

  return (
    <section style={{ padding: 14, borderRadius: 10, border: `1px solid ${colors.border}`, background: "var(--air-surface)", boxShadow: "var(--air-shadow)", borderLeftWidth: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, color: colors.text }}>{String(resolvedProps.title ?? resolvedProps.message ?? "Notification")}</div>
          {resolvedProps.description ? <div style={{ marginTop: 4, color: "var(--air-textSecondary)", fontSize: 13, lineHeight: 1.5 }}>{String(resolvedProps.description)}</div> : null}
        </div>
        <button type="button" onClick={() => { setVisible(false); emit("close", {}); }} style={{ width: 26, height: 26, border: "none", borderRadius: 6, background: "var(--air-surfaceAlt)", color: "var(--air-textMuted)", cursor: "pointer" }}>x</button>
      </div>
      {comp.children?.map((child, index) => <div key={child.ref ?? index} style={{ marginTop: 10 }}><AirUIComponent comp={child} /></div>)}
    </section>
  );
};

export const Popconfirm: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const [open, setOpen] = useState(false);
  const { emit } = useComponentEvents(comp);
  const title = String(resolvedProps.title ?? "Are you sure?");
  const triggerLabel = String(resolvedProps.trigger ?? "Confirm");
  const child = comp.children?.[0];

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span onClick={() => setOpen(true)} style={{ display: "inline-block", cursor: "pointer" }}>
        {child ? <AirUIComponent comp={child} /> : <button type="button" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--air-border)", background: "var(--air-surface)", color: "var(--air-text)", cursor: "pointer" }}>{triggerLabel}</button>}
      </span>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 80, minWidth: 220, padding: 12, borderRadius: 10, border: "1px solid var(--air-border)", background: "var(--air-surface)", boxShadow: "var(--air-shadowHover)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--air-text)", marginBottom: 10 }}>{title}</div>
          {resolvedProps.description ? <div style={{ fontSize: 12, color: "var(--air-textSecondary)", marginBottom: 10 }}>{String(resolvedProps.description)}</div> : null}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
            <button type="button" onClick={() => { setOpen(false); emit("cancel", {}); }} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--air-border)", background: "var(--air-surface)", color: "var(--air-text)", cursor: "pointer" }}>{String(resolvedProps.cancelText ?? "Cancel")}</button>
            <button type="button" onClick={() => { setOpen(false); emit("confirm", {}); }} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "var(--air-accent)", color: "#fff", cursor: "pointer", fontWeight: 700 }}>{String(resolvedProps.confirmText ?? "OK")}</button>
          </div>
        </div>
      )}
    </span>
  );
};

export const ContextMenu: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const items = ((resolvedProps.items as CommandItem[]) ?? []).filter((item) => item.key);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const { emit } = useComponentEvents(comp);

  return (
    <div
      onContextMenu={(event) => { event.preventDefault(); setMenu({ x: event.clientX, y: event.clientY }); emit("open", {}); }}
      style={{ position: "relative", minHeight: (resolvedProps.minHeight as number | string | undefined) ?? "auto" }}
    >
      {comp.children?.map((child, index) => <AirUIComponent key={child.ref ?? index} comp={child} />)}
      {menu && (
        <div style={{ position: "fixed", left: menu.x, top: menu.y, zIndex: 1400, minWidth: 180, padding: 4, borderRadius: 8, border: "1px solid var(--air-border)", background: "var(--air-surface)", boxShadow: "var(--air-shadowHover)" }}>
          {items.map((item) => (
            <button key={item.key} type="button" disabled={item.disabled} onClick={() => { setMenu(null); emit("select", { key: item.key, item }); }} style={{ display: "block", width: "100%", padding: "8px 10px", border: "none", borderRadius: 6, background: "transparent", color: "var(--air-text)", textAlign: "left", cursor: item.disabled ? "not-allowed" : "pointer", opacity: item.disabled ? 0.5 : 1 }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const CommandPalette: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const items = ((resolvedProps.items as CommandItem[]) ?? []).filter((item) => item.key);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState((resolvedProps.open as boolean | undefined) ?? true);
  const { emit } = useComponentEvents(comp);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)).slice(0, 20);
  }, [items, query]);
  if (!open) return null;

  return (
    <div style={{ border: "1px solid var(--air-border)", borderRadius: 12, background: "var(--air-surface)", boxShadow: "var(--air-shadowHover)", overflow: "hidden", maxWidth: (resolvedProps.width as number | string | undefined) ?? 560 }}>
      <input
        autoFocus
        value={query}
        placeholder={(resolvedProps.placeholder as string) ?? "Search commands..."}
        onChange={(event) => { setQuery(event.target.value); emit("search", { query: event.target.value }); }}
        style={{ width: "100%", height: 46, padding: "0 14px", border: "none", borderBottom: "1px solid var(--air-border)", outline: "none", background: "var(--air-surface)", color: "var(--air-text)", fontSize: 14 }}
      />
      <div style={{ maxHeight: 320, overflow: "auto", padding: 6 }}>
        {filtered.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onClick={() => { setOpen(false); emit("select", { key: item.key, item }); }}
            style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, width: "100%", padding: "9px 10px", border: "none", borderRadius: 8, background: "transparent", color: "var(--air-text)", textAlign: "left", cursor: item.disabled ? "not-allowed" : "pointer", opacity: item.disabled ? 0.5 : 1 }}
          >
            <span>
              <strong style={{ display: "block", fontSize: 13 }}>{item.label}</strong>
              {item.description && <span style={{ display: "block", marginTop: 2, fontSize: 12, color: "var(--air-textMuted)" }}>{item.description}</span>}
            </span>
            {item.shortcut && <kbd style={{ alignSelf: "center", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--air-border)", color: "var(--air-textMuted)", fontSize: 11 }}>{item.shortcut}</kbd>}
          </button>
        ))}
        {filtered.length === 0 && <div style={{ padding: 16, color: "var(--air-textMuted)", fontSize: 13 }}>No commands found</div>}
      </div>
    </div>
  );
};
