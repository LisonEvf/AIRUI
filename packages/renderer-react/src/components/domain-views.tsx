import { Fragment, type FC, useMemo, useState } from "react";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";

interface CalendarEvent {
  id?: string;
  date: string;
  title: string;
  color?: string;
}

interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
}

interface KanbanColumn {
  key: string;
  title: string;
  cards?: KanbanCard[];
}

interface MapMarker {
  id?: string;
  label?: string;
  x?: number;
  y?: number;
  lat?: number;
  lng?: number;
  value?: number;
}

interface NetworkNode {
  id: string;
  label?: string;
  x?: number;
  y?: number;
  value?: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  label?: string;
}

const colorMap: Record<string, string> = {
  accent: "var(--air-accent)",
  success: "var(--air-success)",
  danger: "var(--air-danger)",
  warning: "var(--air-warning)",
};

export const Calendar: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const value = String(resolvedProps.month ?? resolvedProps.value ?? new Date().toISOString().slice(0, 7));
  const events = (resolvedProps.events as CalendarEvent[]) ?? [];
  const [month, setMonth] = useState(value);
  const { emit } = useComponentEvents(comp);
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(year, monthNumber - 1, 1);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const offset = first.getDay();
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, index) => index - offset + 1);
  const eventsByDate = new globalThis.Map<string, CalendarEvent[]>();
  events.forEach((event) => {
    const list = eventsByDate.get(event.date) ?? [];
    list.push(event);
    eventsByDate.set(event.date, list);
  });
  const go = (delta: number) => {
    const next = new Date(year, monthNumber - 1 + delta, 1);
    const nextMonth = next.toISOString().slice(0, 7);
    setMonth(nextMonth);
    emit("change", { month: nextMonth });
  };

  return (
    <div style={{ border: "1px solid var(--air-border)", borderRadius: 10, overflow: "hidden", background: "var(--air-surface)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--air-border)" }}>
        <button type="button" onClick={() => go(-1)} style={navButtonStyle}>{"<"}</button>
        <strong>{month}</strong>
        <button type="button" onClick={() => go(1)} style={navButtonStyle}>{">"}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} style={{ padding: 8, fontSize: 11, fontWeight: 800, color: "var(--air-textMuted)", textAlign: "center", background: "var(--air-surfaceAlt)" }}>{day}</div>)}
        {cells.map((day, index) => {
          const valid = day >= 1 && day <= daysInMonth;
          const date = valid ? `${month}-${String(day).padStart(2, "0")}` : "";
          const dayEvents = eventsByDate.get(date) ?? [];
          return (
            <button
              key={index}
              type="button"
              onClick={() => valid && emit("select", { date, events: dayEvents })}
              style={{ minHeight: 78, padding: 6, border: "none", borderRight: "1px solid var(--air-borderLight)", borderBottom: "1px solid var(--air-borderLight)", background: "var(--air-surface)", color: valid ? "var(--air-text)" : "transparent", textAlign: "left", cursor: valid ? "pointer" : "default" }}
            >
              {valid && <span style={{ fontSize: 12, fontWeight: 700 }}>{day}</span>}
              <div style={{ display: "grid", gap: 3, marginTop: 4 }}>
                {dayEvents.slice(0, 3).map((event) => <span key={event.id ?? event.title} style={{ padding: "2px 4px", borderRadius: 4, background: colorMap[event.color ?? "accent"] ?? "var(--air-accent)", color: "#fff", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.title}</span>)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const navButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 6,
  border: "1px solid var(--air-border)",
  background: "var(--air-surface)",
  color: "var(--air-text)",
  cursor: "pointer",
};

export const Kanban: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const columns = (resolvedProps.columns as KanbanColumn[]) ?? [];
  const { emit } = useComponentEvents(comp);

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, columns.length)}, minmax(220px, 1fr))`, gap: 12, overflowX: "auto" }}>
      {columns.map((column) => (
        <section key={column.key} style={{ minHeight: 240, border: "1px solid var(--air-border)", borderRadius: 10, background: "var(--air-surfaceAlt)", padding: 10 }}>
          <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontWeight: 800, color: "var(--air-text)" }}>
            <span>{column.title}</span>
            <span style={{ color: "var(--air-textMuted)", fontSize: 12 }}>{column.cards?.length ?? 0}</span>
          </header>
          <div style={{ display: "grid", gap: 8 }}>
            {(column.cards ?? []).map((card) => (
              <article key={card.id} onClick={() => emit("select", { column: column.key, card })} style={{ padding: 10, borderRadius: 8, background: "var(--air-surface)", border: "1px solid var(--air-border)", boxShadow: "var(--air-shadow)", cursor: "pointer" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--air-text)" }}>{card.title}</div>
                {card.description && <div style={{ fontSize: 12, color: "var(--air-textSecondary)", marginTop: 4, lineHeight: 1.45 }}>{card.description}</div>}
                {card.tags && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>{card.tags.map((tag) => <span key={tag} style={{ padding: "2px 6px", borderRadius: 20, background: "var(--air-accentSubtle)", color: "var(--air-accent)", fontSize: 10, fontWeight: 700 }}>{tag}</span>)}</div>}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export const Map: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const markers = (resolvedProps.markers as MapMarker[]) ?? [];
  const { emit } = useComponentEvents(comp);

  return (
    <div style={{ position: "relative", height: (resolvedProps.height as number | string | undefined) ?? 320, border: "1px solid var(--air-border)", borderRadius: 10, overflow: "hidden", background: "linear-gradient(135deg, #e7f4ff, #f7f2e8)" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5, backgroundImage: "linear-gradient(var(--air-border) 1px, transparent 1px), linear-gradient(90deg, var(--air-border) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
      {markers.map((marker, index) => {
        const x = marker.x ?? ((marker.lng ?? 0) + 180) / 360 * 100;
        const y = marker.y ?? (90 - (marker.lat ?? 0)) / 180 * 100;
        return (
          <button
            key={marker.id ?? index}
            type="button"
            onClick={() => emit("select", { marker, index })}
            title={marker.label}
            style={{ position: "absolute", left: `${Math.max(0, Math.min(100, x))}%`, top: `${Math.max(0, Math.min(100, y))}%`, transform: "translate(-50%, -50%)", minWidth: 24, height: 24, padding: "0 7px", borderRadius: 20, border: "2px solid #fff", background: "var(--air-accent)", color: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.22)", cursor: "pointer", fontSize: 11, fontWeight: 800 }}
          >
            {marker.label ?? marker.value ?? ""}
          </button>
        );
      })}
    </div>
  );
};

export const NetworkGraph: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const nodes = (resolvedProps.nodes as NetworkNode[]) ?? [];
  const edges = (resolvedProps.edges as NetworkEdge[]) ?? [];
  const { emit } = useComponentEvents(comp);
  const positions = useMemo(() => {
    const map = new globalThis.Map<string, { x: number; y: number }>();
    const count = Math.max(1, nodes.length);
    nodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
      map.set(node.id, { x: node.x ?? 50 + Math.cos(angle) * 34, y: node.y ?? 50 + Math.sin(angle) * 34 });
    });
    return map;
  }, [nodes]);

  return (
    <svg viewBox="0 0 100 100" role="img" style={{ width: "100%", height: (resolvedProps.height as number | string | undefined) ?? 360, border: "1px solid var(--air-border)", borderRadius: 10, background: "var(--air-surfaceAlt)" }}>
      {edges.map((edge, index) => {
        const source = positions.get(edge.source);
        const target = positions.get(edge.target);
        if (!source || !target) return null;
        return <line key={index} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="var(--air-border)" strokeWidth="0.8" />;
      })}
      {nodes.map((node) => {
        const pos = positions.get(node.id) ?? { x: 50, y: 50 };
        const radius = Math.max(4, Math.min(10, Number(node.value ?? 6)));
        return (
          <g key={node.id} onClick={() => emit("select", { node })} style={{ cursor: "pointer" }}>
            <circle cx={pos.x} cy={pos.y} r={radius} fill="var(--air-accent)" stroke="#fff" strokeWidth="1.5" />
            <text x={pos.x} y={pos.y + radius + 5} textAnchor="middle" fontSize="3.2" fill="var(--air-text)">{node.label ?? node.id}</text>
          </g>
        );
      })}
    </svg>
  );
};

export const Heatmap: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const data = (resolvedProps.data as Array<{ x: string; y: string; value: number }>) ?? [];
  const { emit } = useComponentEvents(comp);
  const xs = (resolvedProps.xLabels as string[] | undefined) ?? Array.from(new Set(data.map((item) => item.x)));
  const ys = (resolvedProps.yLabels as string[] | undefined) ?? Array.from(new Set(data.map((item) => item.y)));
  const max = Number(resolvedProps.max ?? Math.max(1, ...data.map((item) => item.value)));
  const values = new globalThis.Map(data.map((item) => [`${item.x}::${item.y}`, item]));

  return (
    <div style={{ display: "grid", gridTemplateColumns: `80px repeat(${Math.max(1, xs.length)}, minmax(34px, 1fr))`, gap: 3, fontSize: 11 }}>
      <div />
      {xs.map((x) => <div key={x} style={{ color: "var(--air-textMuted)", textAlign: "center", fontWeight: 700 }}>{x}</div>)}
      {ys.map((y) => (
        <Fragment key={y}>
          <div key={`${y}-label`} style={{ color: "var(--air-textMuted)", fontWeight: 700, alignSelf: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{y}</div>
          {xs.map((x) => {
            const item = values.get(`${x}::${y}`) ?? { x, y, value: 0 };
            const alpha = Math.max(0.08, Math.min(1, item.value / max));
            return (
              <button
                key={`${x}-${y}`}
                type="button"
                onClick={() => emit("select", item)}
                title={`${x} / ${y}: ${item.value}`}
                style={{ minHeight: 30, border: "none", borderRadius: 5, background: `rgba(99, 91, 255, ${alpha})`, color: alpha > 0.55 ? "#fff" : "var(--air-text)", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
              >
                {item.value}
              </button>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
};
