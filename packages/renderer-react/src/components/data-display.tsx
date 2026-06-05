import { type FC } from "react";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";
import { AirUIComponent } from "./engine";

// ─── KPI ───────────────────────────────────────────

export const KPI: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const label = resolvedProps.label as string;
  const value = resolvedProps.value as string;
  const change = resolvedProps.change as string | undefined;
  const trend = resolvedProps.trend as string | undefined;
  const isUp = trend === "up" || (change && change.startsWith("+"));
  const isDown = trend === "down" || (change && change.startsWith("-"));
  const color = isUp ? "var(--air-success)" : isDown ? "var(--air-danger)" : "var(--air-text)";
  const bgColor = isUp ? "var(--air-successBg)" : isDown ? "var(--air-dangerBg)" : "transparent";

  return (
    <div style={{ padding: "8px 4px" }}>
      {label && <div style={{ fontSize: 12, fontWeight: 500, color: "var(--air-textMuted)", marginBottom: 8, letterSpacing: "0.02em", textTransform: "uppercase" as const }}>{label}</div>}
      <div style={{ fontSize: "2rem", fontWeight: 700, color, lineHeight: 1.1, letterSpacing: "-0.03em" }}>{value}</div>
      {change && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 600, color, background: bgColor }}>
          <span style={{ fontSize: 11 }}>{isUp ? "↑" : isDown ? "↓" : ""}</span>{change}
        </div>
      )}
    </div>
  );
};

// ─── PlateCard ─────────────────────────────────────

export const PlateCard: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const name = (resolvedProps.name as string) ?? "";
  const change = resolvedProps.change as string | undefined;
  const lead = resolvedProps.lead as string | undefined;
  const flow = resolvedProps.flow as string | undefined;
  const isUp = change?.startsWith("+");
  const isDown = change?.startsWith("-");
  const color = isUp ? "var(--air-success)" : isDown ? "var(--air-danger)" : "var(--air-text)";
  const { emit } = useComponentEvents(comp);

  return (
    <div onClick={() => emit("drilldown", { name })}
      style={{ padding: "16px 20px", borderRadius: 12, background: "var(--air-surface)", cursor: "pointer", minWidth: 160, border: "1px solid var(--air-border)", boxShadow: "var(--air-shadow)", transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--air-shadowHover)"; e.currentTarget.style.borderColor = "var(--air-accent)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--air-shadow)"; e.currentTarget.style.borderColor = "var(--air-border)"; }}
    >
      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--air-text)", letterSpacing: "-0.01em" }}>{name}</div>
      {change && <div style={{ color, fontSize: 22, fontWeight: 700, marginTop: 8, letterSpacing: "-0.02em" }}>{change}</div>}
      {lead && <div style={{ fontSize: 12, color: "var(--air-textSecondary)", marginTop: 8, lineHeight: 1.4 }}>{lead}</div>}
      {flow && <div style={{ fontSize: 12, color: "var(--air-textMuted)", marginTop: 2, lineHeight: 1.4 }}>{flow}</div>}
    </div>
  );
};

// ─── Gauge ─────────────────────────────────────────

export const Gauge: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const value = Number(resolvedProps.value ?? 0);
  const max = Number(resolvedProps.max ?? 100);
  const label = resolvedProps.label as string | undefined;
  const unit = resolvedProps.unit as string | undefined;
  const pct = Math.min(value / max, 1);
  const deg = pct * 180;
  let color = "var(--air-accent)";
  if (pct >= 0.8) color = "var(--air-danger)";
  else if (pct >= 0.6) color = "var(--air-warning)";

  return (
    <div style={{ textAlign: "center", padding: "12px 0" }}>
      {label && <div style={{ fontSize: 12, fontWeight: 500, color: "var(--air-textMuted)", marginBottom: 8, letterSpacing: "0.02em", textTransform: "uppercase" as const }}>{label}</div>}
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path d="M15,75 A55,55 0 0,1 125,75" fill="none" stroke="var(--air-borderLight)" strokeWidth="10" strokeLinecap="round" />
        <path d="M15,75 A55,55 0 0,1 125,75" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${deg * 0.96} 200`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, color, marginTop: -4, letterSpacing: "-0.02em" }}>{value}{unit ?? ""}</div>
    </div>
  );
};

// ─── Progress ──────────────────────────────────────

export const Progress: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const value = Number(resolvedProps.value ?? 0);
  const max = Number(resolvedProps.max ?? 100);
  const label = resolvedProps.label as string | undefined;
  const showValue = (resolvedProps.showValue as boolean) ?? true;
  const variant = (resolvedProps.variant as string) ?? "line";
  const pct = Math.min(Math.max(value / max, 0), 1) * 100;
  let color = "var(--air-accent)";
  if (pct >= 80) color = "var(--air-danger)";
  else if (pct >= 60) color = "var(--air-warning)";

  if (variant === "circle") {
    const size = 80; const sw = 6; const r = (size - sw) / 2; const circ = 2 * Math.PI * r; const off = circ * (1 - pct / 100);
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        {label && <div style={{ fontSize: 12, color: "var(--air-textMuted)", marginBottom: 8, fontWeight: 500 }}>{label}</div>}
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--air-borderLight)" strokeWidth={sw} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 0.6s" }} />
        </svg>
        {showValue && <div style={{ fontSize: "1.2rem", fontWeight: 700, color, marginTop: 4 }}>{Math.round(pct)}%</div>}
      </div>
    );
  }
  return (
    <div style={{ padding: "4px 0" }}>
      {(label || showValue) && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        {label && <span style={{ fontSize: 13, color: "var(--air-text)", fontWeight: 500 }}>{label}</span>}
        {showValue && <span style={{ fontSize: 13, color, fontWeight: 600 }}>{Math.round(pct)}%</span>}
      </div>}
      <div style={{ width: "100%", height: 6, borderRadius: 3, background: "var(--air-borderLight)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.6s" }} />
      </div>
    </div>
  );
};

// ─── Tag ───────────────────────────────────────────

const tagColors: Record<string, { bg: string; text: string; border: string }> = {
  default: { bg: "var(--air-surfaceAlt)", text: "var(--air-text)", border: "var(--air-border)" },
  success: { bg: "var(--air-successBg)", text: "var(--air-success)", border: "var(--air-success)" },
  danger: { bg: "var(--air-dangerBg)", text: "var(--air-danger)", border: "var(--air-danger)" },
  warning: { bg: "var(--air-warningBg)", text: "var(--air-warning)", border: "var(--air-warning)" },
  accent: { bg: "var(--air-accentSubtle)", text: "var(--air-accent)", border: "var(--air-accent)" },
};

export const Tag: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const label = (resolvedProps.value as string) ?? (resolvedProps.label as string) ?? "";
  const color = (resolvedProps.color as string) ?? "default";
  const variant = (resolvedProps.variant as string) ?? "filled";
  const c = tagColors[color] ?? tagColors.default;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: variant === "outline" ? "transparent" : c.bg, color: c.text, border: `1px solid ${c.border}`, lineHeight: "20px", whiteSpace: "nowrap" as const }}>{label}</span>
  );
};

// ─── Badge ─────────────────────────────────────────

export const Badge: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const value = resolvedProps.value as string | number | undefined;
  const color = (resolvedProps.color as string) ?? "accent";
  const dot = resolvedProps.dot as boolean | undefined;
  const max = (resolvedProps.max as number) ?? 99;
  const colors: Record<string, string> = { accent: "var(--air-accent)", success: "var(--air-success)", danger: "var(--air-danger)", warning: "var(--air-warning)" };
  const bg = colors[color] ?? colors.accent;
  if (dot) return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: bg }} />;
  const display = typeof value === "number" && value > max ? `${max}+` : String(value ?? "");
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 20, height: 20, padding: "0 6px", borderRadius: 10, background: bg, color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>{display}</span>;
};

// ─── Avatar ────────────────────────────────────────

export const Avatar: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const name = (resolvedProps.name as string) ?? "";
  const src = resolvedProps.src as string | undefined;
  const size = Number(resolvedProps.size ?? 36);
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const colors = ["var(--air-accent)", "var(--air-success)", "var(--air-warning)", "var(--air-danger)", "#7c3aed", "#0891b2"];
  const bg = colors[name.length % colors.length];
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--air-surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>{initials}</div>;
};

// ─── Skeleton ──────────────────────────────────────

export const Skeleton: FC<{ comp: any; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => {
  const variant = (resolvedProps.variant as string) ?? "text";
  const width = (resolvedProps.width as string | number) ?? "100%";
  const height = (resolvedProps.height as string | number) ?? undefined;
  const rows = Number(resolvedProps.rows ?? 0);
  const count = Number(resolvedProps.count ?? 1);
  const shimmer: React.CSSProperties = { background: "linear-gradient(90deg, var(--air-borderLight) 25%, var(--air-surfaceAlt) 50%, var(--air-borderLight) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" };
  const els: React.CSSProperties[] = [];
  if (rows > 0) { for (let i = 0; i < rows; i++) els.push({ ...shimmer, width: i === rows - 1 ? "60%" : "100%", height: 14, borderRadius: 4, marginBottom: 8 }); }
  else { for (let i = 0; i < count; i++) { const s: React.CSSProperties = { ...shimmer }; if (variant === "circle") { s.width = 40; s.height = 40; s.borderRadius = "50%"; } else if (variant === "rect") { s.width = width; s.height = height ?? 120; s.borderRadius = 8; } else { s.width = width; s.height = height ?? 16; s.borderRadius = 4; } s.marginBottom = 8; els.push(s); } }
  return <div>{els.map((s, i) => <div key={i} style={s} />)}<style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style></div>;
};
