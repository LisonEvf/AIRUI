import { type FC } from "react";
import type { Component } from "@air-ui/core";
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
    {resolvedProps.retryable && <div style={{ fontSize: 13, color: "var(--air-textMuted)", marginTop: 8 }}>Retrying...</div>}
  </div>
);

// ─── Tooltip ───────────────────────────────────────

export const Tooltip: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  // Tooltip wraps its first child and shows content on hover
  // Note: this is a static implementation; hover state is managed by CSS or parent
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {comp.children?.[0] && <AirUIComponent comp={comp.children[0]} />}
    </div>
  );
};
