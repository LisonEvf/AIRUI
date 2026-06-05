import { type FC, useState, useRef, useEffect } from "react";
import type { Component } from "@air-ui/core";
import { useEventHandler, useComponentEvents } from "../hooks";
import { useInteraction } from "../interaction";

// ─── Button ────────────────────────────────────────

export const Button: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const disabled = resolvedProps.disabled as boolean | false;
  const label = resolvedProps.label as string;
  const variant = (resolvedProps.variant as string) ?? "primary";
  const onClick = useEventHandler(comp.on?.click);
  const { emit } = useComponentEvents(comp);

  const isPrimary = variant === "primary";
  const base: React.CSSProperties = {
    padding: "8px 20px", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.15s", letterSpacing: "-0.01em",
    opacity: disabled ? 0.5 : 1,
  };
  const variantStyle: React.CSSProperties = isPrimary
    ? { ...base, background: "var(--air-accent)", color: "#fff" }
    : { ...base, background: "var(--air-surfaceAlt)", color: "var(--air-text)", border: "1px solid var(--air-border)" };

  return (
    <button
      onClick={() => { if (disabled) return; onClick?.(); emit("click", { label }); }}
      disabled={disabled}
      style={variantStyle}
      onMouseEnter={(e) => { if (disabled) return; if (isPrimary) { e.currentTarget.style.background = "var(--air-accentHover)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,91,255,0.25)"; } else { e.currentTarget.style.borderColor = "var(--air-accent)"; } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; if (isPrimary) e.currentTarget.style.background = "var(--air-accent)"; else e.currentTarget.style.borderColor = "var(--air-border)"; }}
    >{label}</button>
  );
};

// ─── Input ─────────────────────────────────────────

export const Input: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => (
  <input
    type={(resolvedProps.type as string) ?? "text"}
    placeholder={(resolvedProps.placeholder as string) ?? ""}
    style={{
      padding: "10px 16px", border: "1px solid var(--air-border)", borderRadius: 8, fontSize: 14,
      width: "100%", background: "var(--air-surface)", color: "var(--air-text)", outline: "none",
      transition: "border-color 0.2s, box-shadow 0.2s", letterSpacing: "-0.01em",
    }}
    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--air-accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--air-accentSubtle)"; }}
    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--air-border)"; e.currentTarget.style.boxShadow = "none"; }}
  />
);

// ─── Select ────────────────────────────────────────

interface SelectOption { value: string; label: string }

export const Select: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const options = (resolvedProps.options as SelectOption[]) ?? [];
  const placeholder = (resolvedProps.placeholder as string) ?? "Select...";
  const value = resolvedProps.value as string | undefined;
  const disabled = resolvedProps.disabled as boolean | false;
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(value ?? "");
  const { emit } = useComponentEvents(comp);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ?? internal;
  const selectedLabel = options.find((o) => o.value === selected)?.label ?? placeholder;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 180 }}>
      <div onClick={() => { if (!disabled) setOpen(!open); }}
        style={{ padding: "10px 36px 10px 14px", border: "1px solid var(--air-border)", borderRadius: 8, fontSize: 14, background: "var(--air-surface)", color: selected ? "var(--air-text)" : "var(--air-textMuted)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "border-color 0.15s", userSelect: "none", position: "relative" }}>
        {selectedLabel}
        <svg style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, transition: "transform 0.2s" }} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--air-textMuted)" strokeWidth="2" strokeLinecap="round"><path d="M3 5l4 4 4-4" /></svg>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--air-surface)", border: "1px solid var(--air-border)", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden", animation: "fadeIn 0.15s ease-out" }}>
          {options.map((opt) => (
            <div key={opt.value} onClick={() => { setInternal(opt.value); setOpen(false); emit("change", { value: opt.value }); }}
              style={{ padding: "9px 14px", fontSize: 14, cursor: "pointer", background: opt.value === selected ? "var(--air-accentSubtle)" : "transparent", color: opt.value === selected ? "var(--air-accent)" : "var(--air-text)", fontWeight: opt.value === selected ? 600 : 400, transition: "background 0.1s" }}
              onMouseEnter={(e) => { if (opt.value !== selected) e.currentTarget.style.background = "var(--air-surfaceAlt)"; }}
              onMouseLeave={(e) => { if (opt.value !== selected) e.currentTarget.style.background = "transparent"; }}
            >{opt.label}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Switch ────────────────────────────────────────

export const Switch: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const propChecked = resolvedProps.checked as boolean | undefined;
  const disabled = resolvedProps.disabled as boolean | false;
  const label = resolvedProps.label as string | undefined;
  const [internal, setInternal] = useState(propChecked ?? false);
  const { emit } = useComponentEvents(comp);
  const checked = propChecked ?? internal;

  return (
    <div onClick={() => { if (disabled) return; const next = !checked; setInternal(next); emit("change", { checked: next }); }}
      style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, userSelect: "none" }}>
      <div style={{ width: 40, height: 22, borderRadius: 11, background: checked ? "var(--air-accent)" : "var(--air-border)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: checked ? 21 : 3, transition: "left 0.2s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
      </div>
      {label && <span style={{ fontSize: 14, color: "var(--air-text)", fontWeight: 500 }}>{label}</span>}
    </div>
  );
};

// ─── Checkbox ──────────────────────────────────────

export const Checkbox: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const propChecked = resolvedProps.checked as boolean | undefined;
  const disabled = resolvedProps.disabled as boolean | false;
  const label = resolvedProps.label as string | undefined;
  const [internal, setInternal] = useState(propChecked ?? false);
  const { emit } = useComponentEvents(comp);
  const checked = propChecked ?? internal;

  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, userSelect: "none" }}>
      <div onClick={() => { if (disabled) return; const next = !checked; setInternal(next); emit("change", { checked: next }); }}
        style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? "var(--air-accent)" : "var(--air-border)"}`, background: checked ? "var(--air-accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}>
        {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5l2.5 2.5L8 3" /></svg>}
      </div>
      {label && <span style={{ fontSize: 14, color: "var(--air-text)", fontWeight: 500 }}>{label}</span>}
    </label>
  );
};

// ─── Radio ─────────────────────────────────────────

interface RadioOption { value: string; label: string }

export const Radio: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const options = (resolvedProps.options as RadioOption[]) ?? [];
  const propValue = resolvedProps.value as string | undefined;
  const disabled = resolvedProps.disabled as boolean | false;
  const direction = (resolvedProps.direction as string) ?? "vertical";
  const { emit } = useComponentEvents(comp);
  const [internal, setInternal] = useState(propValue ?? options[0]?.value ?? "");
  const selected = propValue ?? internal;

  return (
    <div style={{ display: "flex", flexDirection: direction === "horizontal" ? "row" : "column", gap: direction === "horizontal" ? 16 : 8 }}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <label key={opt.value} onClick={() => { if (disabled) return; setInternal(opt.value); emit("change", { value: opt.value }); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, userSelect: "none" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? "var(--air-accent)" : "var(--air-border)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.15s", flexShrink: 0 }}>
              {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--air-accent)" }} />}
            </div>
            <span style={{ fontSize: 14, color: "var(--air-text)", fontWeight: 500 }}>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
};

// ─── Slider ────────────────────────────────────────

export const Slider: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const min = Number(resolvedProps.min ?? 0);
  const max = Number(resolvedProps.max ?? 100);
  const propValue = resolvedProps.value as number | undefined;
  const step = Number(resolvedProps.step ?? 1);
  const label = resolvedProps.label as string | undefined;
  const disabled = resolvedProps.disabled as boolean | false;
  const showValue = (resolvedProps.showValue as boolean) ?? true;
  const { emit } = useComponentEvents(comp);
  const [internal, setInternal] = useState(propValue ?? min);
  const value = propValue ?? internal;
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = ((value - min) / (max - min)) * 100;

  const update = (clientX: number) => {
    if (!trackRef.current || disabled) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let raw = Math.round((min + ratio * (max - min)) / step) * step;
    raw = Math.max(min, Math.min(max, raw));
    setInternal(raw);
    emit("change", { value: raw });
  };

  const handleDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    update(e.clientX);
    const move = (ev: MouseEvent) => update(ev.clientX);
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <div style={{ padding: "4px 0" }}>
      {(label || showValue) && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        {label && <span style={{ fontSize: 13, color: "var(--air-text)", fontWeight: 500 }}>{label}</span>}
        {showValue && <span style={{ fontSize: 13, color: "var(--air-accent)", fontWeight: 600 }}>{value}</span>}
      </div>}
      <div ref={trackRef} onMouseDown={handleDown} style={{ position: "relative", height: 6, borderRadius: 3, background: "var(--air-borderLight)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1 }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, borderRadius: 3, background: "var(--air-accent)" }} />
        <div style={{ position: "absolute", top: "50%", left: `${pct}%`, width: 16, height: 16, borderRadius: "50%", background: "#fff", border: "2px solid var(--air-accent)", transform: "translate(-50%, -50%)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", cursor: disabled ? "not-allowed" : "grab" }} />
      </div>
    </div>
  );
};

// ─── Image ─────────────────────────────────────────

export const Image: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ resolvedProps }) => (
  <img src={resolvedProps.src as string} alt={(resolvedProps.alt as string) ?? ""} style={{ maxWidth: "100%", height: "auto" }} />
);

// ─── Dropdown (native) ─────────────────────────────

export const Dropdown: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const options = (resolvedProps.options as Array<{ label: string; value: string }>) ?? [];
  const selected = resolvedProps.selected as string;
  const onChange = useEventHandler(comp.on?.change);
  return (
    <select value={selected ?? ""} onChange={(e) => onChange?.({ value: e.target.value })}
      style={{ padding: "6px 12px", border: "1px solid var(--air-border)", borderRadius: 6 }}>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
};
