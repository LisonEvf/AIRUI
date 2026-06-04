import { type FC, type CSSProperties } from "react";
import type { Component, EventHandler } from "@air-ui/core";
import { interpolate } from "@air-ui/core";
import { useAirUIStore } from "./store";
import { handleEvent } from "./host";

// ── Style Helpers ──

const gapMap: Record<string, string> = {
  small: "4px",
  medium: "8px",
  large: "16px",
};

const alignMap: Record<string, CSSProperties["alignItems"]> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
};

function resolveGap(gap?: string | number): string | undefined {
  if (gap === undefined) return undefined;
  if (typeof gap === "number") return `${gap}px`;
  return gapMap[gap] ?? gap;
}

function resolveAlign(align?: string): CSSProperties["alignItems"] {
  return align ? (alignMap[align] ?? align) : undefined;
}

// ── Event Handler Hook ──

function useEventHandler(handler: EventHandler | undefined) {
  const doc = useAirUIStore((s) => s.doc);
  const setDoc = useAirUIStore((s) => s.setDoc);

  if (!handler || !doc) return undefined;

  return (eventData?: Record<string, unknown>) => {
    handleEvent(handler, eventData ?? {}, doc.state, (newState) => {
      setDoc({ ...doc, state: newState });
    });
  };
}

// ── Built-in Components ──

export const Column: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({
  comp,
  resolvedProps,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: resolveGap(resolvedProps.gap as string),
        padding: resolveGap(resolvedProps.padding as string),
        alignItems: resolveAlign(resolvedProps.align as string),
      }}
    >
      {comp.children?.map((child, i) => (
        <AirUIComponent key={child.ref ?? i} comp={child} />
      ))}
    </div>
  );
};

export const Row: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({
  comp,
  resolvedProps,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: resolveGap(resolvedProps.gap as string),
        padding: resolveGap(resolvedProps.padding as string),
        alignItems: resolveAlign(resolvedProps.align as string),
      }}
    >
      {comp.children?.map((child, i) => (
        <AirUIComponent key={child.ref ?? i} comp={child} />
      ))}
    </div>
  );
};

export const Text: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({
  resolvedProps,
}) => {
  const doc = useAirUIStore((s) => s.doc);
  const value = resolvedProps.value as string;
  const text = doc ? interpolate(String(value ?? ""), doc.state) : String(value ?? "");

  const styleMap: Record<string, CSSProperties> = {
    title: { fontSize: "1.5rem", fontWeight: "bold" },
    subtitle: { fontSize: "1.2rem", fontWeight: 600 },
    body: { fontSize: "1rem" },
    caption: { fontSize: "0.875rem", color: "#666" },
  };

  return <span style={styleMap[resolvedProps.style as string] ?? { fontSize: "1rem" }}>{text}</span>;
};

export const Button: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({
  comp,
  resolvedProps,
}) => {
  const onClick = useEventHandler(comp.on?.click);
  const disabled = resolvedProps.disabled as boolean;

  return (
    <button
      onClick={() => onClick?.()}
      disabled={disabled}
      style={{
        padding: "6px 16px",
        border: "1px solid #d0d0d0",
        borderRadius: "4px",
        background: disabled ? "#f0f0f0" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "14px",
      }}
    >
      {resolvedProps.label as string}
    </button>
  );
};

export const Input: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({
  comp,
  resolvedProps,
}) => {
  const doc = useAirUIStore((s) => s.doc);
  const setDoc = useAirUIStore((s) => s.setDoc);
  const onChange = useEventHandler(comp.on?.change);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!doc || !comp.on?.change) return;
    const target = comp.on.change.target;
    if (target) {
      const newState = { ...doc.state };
      const segments = target.replace(/^@?state\./, "").split(".");
      let current: Record<string, unknown> = newState;
      for (let i = 0; i < segments.length - 1; i++) {
        if (typeof current[segments[i]] !== "object") current[segments[i]] = {};
        current = current[segments[i]] as Record<string, unknown>;
      }
      current[segments[segments.length - 1]] = e.target.value;
      setDoc({ ...doc, state: newState });
    }
    onChange?.({ value: e.target.value });
  };

  return (
    <input
      type={(resolvedProps.type as string) ?? "text"}
      value={(resolvedProps.value as string) ?? ""}
      placeholder={(resolvedProps.placeholder as string) ?? ""}
      onChange={handleChange}
      style={{
        padding: "6px 12px",
        border: "1px solid #d0d0d0",
        borderRadius: "4px",
        fontSize: "14px",
      }}
    />
  );
};

export const Image: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({
  resolvedProps,
}) => {
  return (
    <img
      src={resolvedProps.src as string}
      alt={(resolvedProps.alt as string) ?? ""}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
};

export const Dropdown: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({
  comp,
  resolvedProps,
}) => {
  const doc = useAirUIStore((s) => s.doc);
  const setDoc = useAirUIStore((s) => s.setDoc);
  const onChange = useEventHandler(comp.on?.change);
  const options = (resolvedProps.options as Array<{ label: string; value: string }>) ?? [];
  const selected = resolvedProps.selected as string;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!doc) return;
    const target = comp.on?.change?.target;
    if (target) {
      const newState = { ...doc.state };
      const segments = target.replace(/^@?state\./, "").split(".");
      let current: Record<string, unknown> = newState;
      for (let i = 0; i < segments.length - 1; i++) {
        if (typeof current[segments[i]] !== "object") current[segments[i]] = {};
        current = current[segments[i]] as Record<string, unknown>;
      }
      current[segments[segments.length - 1]] = e.target.value;
      setDoc({ ...doc, state: newState });
    }
    onChange?.({ value: e.target.value });
  };

  return (
    <select
      value={selected ?? ""}
      onChange={handleChange}
      style={{ padding: "6px 12px", border: "1px solid #d0d0d0", borderRadius: "4px" }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

// ── Render Engine ──

import { getRegisteredComponent } from "./registry";

export const AirUIComponent: FC<{ comp: Component }> = ({ comp }) => {
  const doc = useAirUIStore((s) => s.doc);
  if (!doc) return null;

  // Resolve props: interpolate state references
  const resolvedProps = resolveProps(comp.props ?? {}, doc.state);

  // Check custom component registry first
  const customRenderer = getRegisteredComponent(comp.type);
  if (customRenderer) {
    const CustomComp = customRenderer;
    return <CustomComp comp={comp} resolvedProps={resolvedProps} />;
  }

  // Built-in component switch
  switch (comp.type) {
    case "Column":
      return <Column comp={comp} resolvedProps={resolvedProps} />;
    case "Row":
      return <Row comp={comp} resolvedProps={resolvedProps} />;
    case "Text":
      return <Text comp={comp} resolvedProps={resolvedProps} />;
    case "Button":
      return <Button comp={comp} resolvedProps={resolvedProps} />;
    case "Input":
      return <Input comp={comp} resolvedProps={resolvedProps} />;
    case "Image":
      return <Image comp={comp} resolvedProps={resolvedProps} />;
    case "Dropdown":
      return <Dropdown comp={comp} resolvedProps={resolvedProps} />;
    default:
      return <div style={{ color: "red" }}>Unknown component: {comp.type}</div>;
  }
};

function resolveProps(
  props: Record<string, unknown>,
  state: Record<string, unknown>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string") {
      if (value.startsWith("@state.")) {
        // Direct state reference
        const path = value.slice(7);
        const segments = path.split(".");
        let current: unknown = state;
        for (const seg of segments) {
          if (current === null || current === undefined || typeof current !== "object") {
            current = undefined;
            break;
          }
          current = (current as Record<string, unknown>)[seg];
        }
        resolved[key] = current;
      } else if (value.includes("{state.")) {
        // Template interpolation: "Hello {state.name}" or "{state.indices.0.value}"
        resolved[key] = interpolate(value, state);
      } else {
        resolved[key] = value;
      }
    } else if (Array.isArray(value)) {
      // Resolve each item in arrays (for columns, options, etc.)
      resolved[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? resolveProps(item as Record<string, unknown>, state)
          : item,
      );
    } else if (typeof value === "object" && value !== null) {
      resolved[key] = resolveProps(value as Record<string, unknown>, state);
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}
