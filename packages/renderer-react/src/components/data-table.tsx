import { type FC, useRef, useState, useCallback, useMemo } from "react";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";

interface ColumnDef { key: string; label: string; action?: string; color?: string }
const ROW_HEIGHT = 44;
const OVERSCAN = 5;

export const Table: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const data = (resolvedProps.data as Record<string, unknown>[]) ?? [];
  const columns = (resolvedProps.columns as ColumnDef[]) ?? [];
  const hasAction = columns.some((c) => c.action);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const maxH = 600;
  const totalH = data.length * ROW_HEIGHT;
  const { emit } = useComponentEvents(comp);

  const handleScroll = useCallback(() => { if (scrollRef.current) setScrollTop(scrollRef.current.scrollTop); }, []);

  const { startIndex, endIndex, visibleData } = useMemo(() => {
    if (data.length <= 50) return { startIndex: 0, endIndex: data.length, visibleData: data };
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const cnt = Math.ceil(maxH / ROW_HEIGHT);
    const end = Math.min(data.length, start + cnt + OVERSCAN * 2);
    return { startIndex: start, endIndex: end, visibleData: data.slice(start, end) };
  }, [data, scrollTop]);

  const table = (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead><tr>{columns.map((col) => (
        <th key={col.key} style={{ textAlign: "left", padding: "10px 16px", borderBottom: "1px solid var(--air-border)", fontWeight: 600, fontSize: 12, letterSpacing: "0.02em", color: "var(--air-textMuted)", textTransform: "uppercase" as const, position: "sticky", top: 0, background: "var(--air-surface)", zIndex: 1 }}>{col.label}</th>
      ))}</tr></thead>
      <tbody>
        {data.length > 50 && <tr style={{ height: startIndex * ROW_HEIGHT }}><td /></tr>}
        {visibleData.map((row, vi) => {
          const ai = data.length > 50 ? startIndex + vi : vi;
          const hov = hoverRow === ai;
          return (
            <tr key={ai} onClick={() => emit("drilldown", { row, index: ai })}
              onMouseEnter={() => setHoverRow(ai)} onMouseLeave={() => setHoverRow(null)}
              style={{ cursor: hasAction ? "pointer" : "default", height: ROW_HEIGHT, background: hov ? "var(--air-surfaceAlt)" : "transparent", transition: "background 0.15s" }}>
              {columns.map((col) => {
                const val = row[col.key];
                const c = col.color === "signed" ? String(val).startsWith("+") ? "var(--air-success)" : String(val).startsWith("-") ? "var(--air-danger)" : "var(--air-text)" : "var(--air-text)";
                return <td key={col.key} style={{ padding: "10px 16px", color: c, fontWeight: col.color === "signed" && c !== "var(--air-text)" ? 600 : 400, borderBottom: "1px solid var(--air-borderLight)" }}>{String(val ?? "")}</td>;
              })}
            </tr>
          );
        })}
        {data.length > 50 && <tr style={{ height: Math.max(0, (data.length - endIndex) * ROW_HEIGHT) }}><td /></tr>}
      </tbody>
    </table>
  );

  if (data.length > 50) return <div ref={scrollRef} onScroll={handleScroll} style={{ maxHeight: maxH, overflowY: "auto" }}><div style={{ height: totalH, position: "relative" }}><div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>{table}</div></div></div>;
  return table;
};

// ─── Pagination ────────────────────────────────────

export const Pagination: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const total = Number(resolvedProps.total ?? 0);
  const pageSize = Number(resolvedProps.pageSize ?? 10);
  const currentProp = resolvedProps.current as number | undefined;
  const { emit } = useComponentEvents(comp);
  const [internalPage, setInternalPage] = useState(1);
  const current = currentProp ?? internalPage;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goTo = (p: number) => { const pg = Math.max(1, Math.min(p, totalPages)); setInternalPage(pg); emit("change", { page: pg, pageSize }); };

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else { pages.push(1); if (current > 3) pages.push("..."); const s = Math.max(2, current - 1), e = Math.min(totalPages - 1, current + 1); for (let i = s; i <= e; i++) pages.push(i); if (current < totalPages - 2) pages.push("..."); pages.push(totalPages); }

  const btn: React.CSSProperties = { width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontSize: 13, cursor: "pointer", border: "none", transition: "all 0.15s", fontWeight: 500 };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 0" }}>
      <button onClick={() => goTo(current - 1)} disabled={current <= 1} style={{ ...btn, background: "transparent", color: "var(--air-textSecondary)", opacity: current <= 1 ? 0.3 : 1 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 3L5 7l4 4" /></svg>
      </button>
      {pages.map((p, i) => p === "..." ? <span key={`d${i}`} style={{ ...btn, cursor: "default", color: "var(--air-textMuted)" }}>...</span> : (
        <button key={p} onClick={() => goTo(p as number)} style={{ ...btn, background: p === current ? "var(--air-accent)" : "transparent", color: p === current ? "#fff" : "var(--air-textSecondary)" }}
          onMouseEnter={(e) => { if (p !== current) e.currentTarget.style.background = "var(--air-surfaceAlt)"; }}
          onMouseLeave={(e) => { if (p !== current) e.currentTarget.style.background = "transparent"; }}>{p}</button>
      ))}
      <button onClick={() => goTo(current + 1)} disabled={current >= totalPages} style={{ ...btn, background: "transparent", color: "var(--air-textSecondary)", opacity: current >= totalPages ? 0.3 : 1 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 3l4 4-4 4" /></svg>
      </button>
      <span style={{ marginLeft: 12, fontSize: 13, color: "var(--air-textMuted)" }}>{total} items</span>
    </div>
  );
};
