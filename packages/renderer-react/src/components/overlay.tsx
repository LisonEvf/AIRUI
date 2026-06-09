import { type FC, useState, useEffect, useRef } from "react";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";
import { AirUIComponent } from "./engine";

// ─── Modal ─────────────────────────────────────────

export const Modal: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const propVisible = resolvedProps.visible !== false;
  const [visible, setVisible] = useState(propVisible);
  const title = (resolvedProps.title as string) ?? "";
  const width = (resolvedProps.width as number) ?? 520;
  const inline = (resolvedProps.inline as boolean | undefined) ?? false;
  useEffect(() => { setVisible(propVisible); }, [propVisible]);
  if (!visible) return null;
  const close = () => { setVisible(false); emit("close", {}); };
  const { emit } = useComponentEvents(comp);

  if (inline) {
    return (
      <div style={{ width: "100%", maxWidth: width, border: "1px solid var(--air-border)", borderRadius: 12, background: "var(--air-surface)", overflow: "hidden", boxShadow: "var(--air-shadow)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid var(--air-borderLight)" }}>
          <span style={{ fontWeight: 700, color: "var(--air-text)" }}>{title}</span>
          <button type="button" onClick={close} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "var(--air-surfaceAlt)", color: "var(--air-textMuted)", cursor: "pointer" }}>x</button>
        </div>
        <div style={{ padding: 14 }}>{comp.children?.map((child: any, i: number) => <AirUIComponent key={child.ref ?? i} comp={child} />)}</div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--air-overlay)", backdropFilter: "blur(4px)" }} onClick={close}>
      <div style={{ background: "var(--air-surface)", borderRadius: 16, width, maxHeight: "80vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", animation: "modalIn 0.2s ease-out" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--air-borderLight)" }}>
          <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em", color: "var(--air-text)" }}>{title}</span>
          <button onClick={close} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--air-textMuted)", transition: "background 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--air-surfaceAlt)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>
        <div style={{ padding: 24 }}>{comp.children?.map((child: any, i: number) => <AirUIComponent key={child.ref ?? i} comp={child} />)}</div>
      </div>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
};

// ─── Drawer ────────────────────────────────────────

export const Drawer: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const propVisible = resolvedProps.visible !== false;
  const [visible, setVisible] = useState(propVisible);
  const title = (resolvedProps.title as string) ?? "";
  const width = (resolvedProps.width as number) ?? 360;
  const placement = (resolvedProps.placement as string) ?? "right";
  const inline = (resolvedProps.inline as boolean | undefined) ?? false;
  useEffect(() => { setVisible(propVisible); }, [propVisible]);
  if (!visible) return null;
  const { emit } = useComponentEvents(comp);
  const close = () => { setVisible(false); emit("close", {}); };
  const isRight = placement === "right";

  if (inline) {
    return (
      <div style={{ width: "100%", maxWidth: width, minHeight: 220, border: "1px solid var(--air-border)", borderRadius: 12, background: "var(--air-surface)", boxShadow: "var(--air-shadow)", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid var(--air-borderLight)" }}>
          <span style={{ fontWeight: 700, color: "var(--air-text)" }}>{title}</span>
          <button type="button" onClick={close} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "var(--air-surfaceAlt)", color: "var(--air-textMuted)", cursor: "pointer" }}>x</button>
        </div>
        <div style={{ padding: 14 }}>{comp.children?.map((child: any, i: number) => <AirUIComponent key={child.ref ?? i} comp={child} />)}</div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: isRight ? "flex-end" : "flex-start", background: "var(--air-overlay)", backdropFilter: "blur(4px)" }} onClick={close}>
      <div style={{ width, height: "100%", background: "var(--air-surface)", boxShadow: isRight ? "-4px 0 20px rgba(0,0,0,0.1)" : "4px 0 20px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", animation: `${isRight ? "drawerR" : "drawerL"} 0.25s ease-out` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--air-borderLight)", flexShrink: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: "var(--air-text)" }}>{title}</span>
          <button onClick={close} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--air-textMuted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--air-surfaceAlt)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>
        <div style={{ flex: 1, padding: 24, overflow: "auto" }}>{comp.children?.map((child: any, i: number) => <AirUIComponent key={child.ref ?? i} comp={child} />)}</div>
      </div>
      <style>{`@keyframes drawerR { from { transform: translateX(100%); } to { transform: translateX(0); } } @keyframes drawerL { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
};

// ─── DropdownMenu ──────────────────────────────────

interface MenuItem { key: string; label: string; disabled?: boolean; danger?: boolean; divider?: boolean }

export const DropdownMenu: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const items = (resolvedProps.items as MenuItem[]) ?? [];
  const trigger = (resolvedProps.trigger as string) ?? "Menu";
  const [open, setOpen] = useState(false);
  const { emit } = useComponentEvents(comp);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(!open)}
        style={{ padding: "8px 16px", border: "1px solid var(--air-border)", borderRadius: 8, background: "var(--air-surface)", color: "var(--air-text)", fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "border-color 0.15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--air-accent)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--air-border)"; }}>
        {trigger}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--air-textMuted)" strokeWidth="2" strokeLinecap="round"><path d="M3 4.5l3 3 3-3" /></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 160, background: "var(--air-surface)", border: "1px solid var(--air-border)", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden", padding: "4px 0", animation: "fadeIn 0.15s ease-out" }}>
          {items.map((item) => (
            <div key={item.key} onClick={() => { if (item.disabled) return; setOpen(false); emit("select", { key: item.key }); }}
              style={{ padding: "8px 14px", fontSize: 13, cursor: item.disabled ? "not-allowed" : "pointer", opacity: item.disabled ? 0.4 : 1, color: item.danger ? "var(--air-danger)" : "var(--air-text)", fontWeight: item.danger ? 600 : 400, transition: "background 0.1s", borderBottom: item.divider ? "1px solid var(--air-borderLight)" : "none", paddingBottom: item.divider ? 12 : 8, marginBottom: item.divider ? 4 : 0 }}
              onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = "var(--air-surfaceAlt)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>{item.label}</div>
          ))}
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};
