import { type FC, useMemo, useRef, useState } from "react";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";
import { AirUIComponent } from "./engine";

interface GridColumn {
  key: string;
  label: string;
  width?: number | string;
  sortable?: boolean;
  filterable?: boolean;
  align?: "left" | "center" | "right";
}

const ROW_HEIGHT = 42;
const OVERSCAN = 6;

export const DataGrid: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const columns = (resolvedProps.columns as GridColumn[]) ?? [];
  const data = (resolvedProps.data as Record<string, unknown>[]) ?? [];
  const selectable = (resolvedProps.selectable as boolean | undefined) ?? false;
  const filterable = (resolvedProps.filterable as boolean | undefined) ?? true;
  const maxHeight = Number(resolvedProps.maxHeight ?? 520);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { emit } = useComponentEvents(comp);

  const rows = useMemo(() => {
    let next = data.map((row, index) => ({ row, index }));
    if (filter) {
      const query = filter.toLowerCase();
      next = next.filter(({ row }) => columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(query)));
    }
    if (sort) {
      next = [...next].sort((a, b) => {
        const av = a.row[sort.key];
        const bv = b.row[sort.key];
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av ?? "").localeCompare(String(bv ?? ""));
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return next;
  }, [columns, data, filter, sort]);

  const startIndex = rows.length > 60 ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN) : 0;
  const visibleCount = rows.length > 60 ? Math.ceil(maxHeight / ROW_HEIGHT) + OVERSCAN * 2 : rows.length;
  const visibleRows = rows.slice(startIndex, startIndex + visibleCount);

  const toggleSort = (column: GridColumn) => {
    if (column.sortable === false) return;
    const next = sort?.key === column.key && sort.dir === "asc" ? { key: column.key, dir: "desc" as const } : { key: column.key, dir: "asc" as const };
    setSort(next);
    emit("sort", next);
  };

  const toggleRow = (index: number, row: Record<string, unknown>) => {
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelected(next);
    emit("select", { selected: Array.from(next), row, index });
  };

  const columnTemplate = `${selectable ? "40px " : ""}${columns.map((column) => typeof column.width === "number" ? `${column.width}px` : column.width ?? "minmax(120px, 1fr)").join(" ")}`;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {filterable && (
        <input
          value={filter}
          placeholder={(resolvedProps.filterPlaceholder as string) ?? "Filter rows..."}
          onChange={(event) => { setFilter(event.target.value); emit("filter", { query: event.target.value }); }}
          style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: 8, border: "1px solid var(--air-border)", background: "var(--air-surface)", color: "var(--air-text)" }}
        />
      )}
      <div ref={scrollRef} onScroll={() => setScrollTop(scrollRef.current?.scrollTop ?? 0)} style={{ maxHeight, overflow: "auto", border: "1px solid var(--air-border)", borderRadius: 8 }}>
        <div style={{ minWidth: columns.length * 130, height: rows.length > 60 ? rows.length * ROW_HEIGHT + ROW_HEIGHT : undefined, position: "relative" }}>
          <div style={{ position: rows.length > 60 ? "absolute" : "relative", top: rows.length > 60 ? startIndex * ROW_HEIGHT : 0, left: 0, right: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: columnTemplate, position: "sticky", top: 0, zIndex: 2, background: "var(--air-surfaceAlt)", borderBottom: "1px solid var(--air-border)" }}>
              {selectable && <div />}
              {columns.map((column) => (
                <button
                  key={column.key}
                  type="button"
                  onClick={() => toggleSort(column)}
                  style={{ minHeight: ROW_HEIGHT, padding: "0 12px", border: "none", background: "transparent", color: "var(--air-textMuted)", textAlign: column.align ?? "left", fontSize: 12, fontWeight: 800, textTransform: "uppercase", cursor: column.sortable === false ? "default" : "pointer" }}
                >
                  {column.label}{sort?.key === column.key ? sort.dir === "asc" ? " ↑" : " ↓" : ""}
                </button>
              ))}
            </div>
            {visibleRows.map(({ row, index }) => {
              const checked = selected.has(index);
              return (
                <div key={index} onClick={() => emit("rowClick", { row, index })} style={{ display: "grid", gridTemplateColumns: columnTemplate, minHeight: ROW_HEIGHT, borderBottom: "1px solid var(--air-borderLight)", background: checked ? "var(--air-accentSubtle)" : "var(--air-surface)", cursor: "pointer" }}>
                  {selectable && (
                    <label onClick={(event) => event.stopPropagation()} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleRow(index, row)} />
                    </label>
                  )}
                  {columns.map((column) => (
                    <div key={column.key} style={{ padding: "10px 12px", fontSize: 13, color: "var(--air-text)", textAlign: column.align ?? "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {String(row[column.key] ?? "")}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const EmptyState: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const { emit } = useComponentEvents(comp);
  const title = (resolvedProps.title as string) ?? "No data";
  const description = resolvedProps.description as string | undefined;
  const actionLabel = resolvedProps.actionLabel as string | undefined;

  return (
    <div style={{ minHeight: (resolvedProps.height as number | string | undefined) ?? 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, border: "1px dashed var(--air-border)", borderRadius: 10, background: "var(--air-surfaceAlt)", color: "var(--air-textSecondary)", textAlign: "center" }}>
      <div style={{ width: 46, height: 46, borderRadius: "50%", border: "1px solid var(--air-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--air-textMuted)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M6 7l1.2 12h9.6L18 7M9 11v5M15 11v5M9 7V5h6v2" /></svg>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--air-text)" }}>{title}</div>
        {description && <div style={{ fontSize: 13, marginTop: 4, maxWidth: 360 }}>{description}</div>}
      </div>
      {actionLabel && <button type="button" onClick={() => emit("action", {})} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "var(--air-accent)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{actionLabel}</button>}
      {comp.children?.map((child, index) => <AirUIComponent key={child.ref ?? index} comp={child} />)}
    </div>
  );
};

