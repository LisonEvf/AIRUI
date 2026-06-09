import { type FC, useMemo, useRef, useState } from "react";
import type { Component } from "@air-ui/core";
import { useComponentEvents } from "../hooks";
import { AirUIComponent } from "./engine";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

const fieldBase: React.CSSProperties = {
  width: "100%",
  minHeight: 38,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--air-border)",
  background: "var(--air-surface)",
  color: "var(--air-text)",
  fontSize: 14,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--air-text)",
};

function normalizeOptions(value: unknown): Option[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return { value: item, label: item };
    const option = item as Partial<Option>;
    return { value: String(option.value ?? option.label ?? ""), label: String(option.label ?? option.value ?? ""), disabled: option.disabled };
  }).filter((option) => option.value);
}

export const Form: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const { emit } = useComponentEvents(comp);
  const title = resolvedProps.title as string | undefined;
  const submitLabel = (resolvedProps.submitLabel as string | undefined) ?? "Submit";
  const showSubmit = (resolvedProps.showSubmit as boolean | undefined) ?? true;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const values: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
        formData.forEach((value, key) => {
          const existing = values[key];
          if (existing === undefined) values[key] = value;
          else if (Array.isArray(existing)) existing.push(value);
          else values[key] = [existing, value];
        });
        emit("submit", { values });
      }}
      style={{ display: "grid", gap: 14 }}
    >
      {title && <div style={{ fontSize: 16, fontWeight: 700, color: "var(--air-text)" }}>{title}</div>}
      {comp.children?.map((child, index) => <AirUIComponent key={child.ref ?? index} comp={child} />)}
      {showSubmit && (
        <button type="submit" style={{ justifySelf: "start", padding: "9px 16px", borderRadius: 8, border: "none", background: "var(--air-accent)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          {submitLabel}
        </button>
      )}
    </form>
  );
};

export const Textarea: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const [value, setValue] = useState(String(resolvedProps.value ?? ""));
  const { emit } = useComponentEvents(comp);
  return (
    <label style={labelStyle}>
      {resolvedProps.label as string | undefined}
      <textarea
        name={resolvedProps.name as string | undefined}
        value={value}
        placeholder={(resolvedProps.placeholder as string) ?? ""}
        rows={Number(resolvedProps.rows ?? 4)}
        disabled={(resolvedProps.disabled as boolean | undefined) ?? false}
        onChange={(event) => {
          setValue(event.target.value);
          emit("change", { value: event.target.value });
        }}
        style={{ ...fieldBase, resize: (resolvedProps.resize as "none" | "both" | "horizontal" | "vertical" | undefined) ?? "vertical", lineHeight: 1.5 }}
      />
    </label>
  );
};

export const DatePicker: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const [value, setValue] = useState(String(resolvedProps.value ?? ""));
  const { emit } = useComponentEvents(comp);
  return (
    <label style={labelStyle}>
      {resolvedProps.label as string | undefined}
      <input
        type="date"
        name={resolvedProps.name as string | undefined}
        value={value}
        min={resolvedProps.min as string | undefined}
        max={resolvedProps.max as string | undefined}
        onChange={(event) => { setValue(event.target.value); emit("change", { value: event.target.value }); }}
        style={fieldBase}
      />
    </label>
  );
};

export const TimePicker: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const [value, setValue] = useState(String(resolvedProps.value ?? ""));
  const { emit } = useComponentEvents(comp);
  return (
    <label style={labelStyle}>
      {resolvedProps.label as string | undefined}
      <input
        type="time"
        name={resolvedProps.name as string | undefined}
        value={value}
        step={resolvedProps.step as number | undefined}
        onChange={(event) => { setValue(event.target.value); emit("change", { value: event.target.value }); }}
        style={fieldBase}
      />
    </label>
  );
};

export const DateRangePicker: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const [start, setStart] = useState(String(resolvedProps.start ?? ""));
  const [end, setEnd] = useState(String(resolvedProps.end ?? ""));
  const { emit } = useComponentEvents(comp);
  const update = (nextStart: string, nextEnd: string) => emit("change", { start: nextStart, end: nextEnd });

  return (
    <label style={labelStyle}>
      {resolvedProps.label as string | undefined}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)", alignItems: "center", gap: 8 }}>
        <input type="date" name={resolvedProps.startName as string | undefined} value={start} onChange={(event) => { setStart(event.target.value); update(event.target.value, end); }} style={fieldBase} />
        <span style={{ color: "var(--air-textMuted)", fontSize: 12 }}>to</span>
        <input type="date" name={resolvedProps.endName as string | undefined} value={end} onChange={(event) => { setEnd(event.target.value); update(start, event.target.value); }} style={fieldBase} />
      </div>
    </label>
  );
};

export const NumberInput: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const min = resolvedProps.min as number | undefined;
  const max = resolvedProps.max as number | undefined;
  const step = Number(resolvedProps.step ?? 1);
  const [value, setValue] = useState(Number(resolvedProps.value ?? min ?? 0));
  const { emit } = useComponentEvents(comp);
  const clamp = (next: number) => Math.max(min ?? -Infinity, Math.min(max ?? Infinity, next));
  const update = (next: number) => {
    const clamped = clamp(next);
    setValue(clamped);
    emit("change", { value: clamped });
  };

  return (
    <label style={labelStyle}>
      {resolvedProps.label as string | undefined}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 4 }}>
        <input
          type="number"
          name={resolvedProps.name as string | undefined}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => update(Number(event.target.value || 0))}
          style={fieldBase}
        />
        <button type="button" onClick={() => update(value - step)} style={stepperStyle}>-</button>
        <button type="button" onClick={() => update(value + step)} style={stepperStyle}>+</button>
      </div>
    </label>
  );
};

const stepperStyle: React.CSSProperties = {
  width: 38,
  border: "1px solid var(--air-border)",
  borderRadius: 8,
  background: "var(--air-surfaceAlt)",
  color: "var(--air-text)",
  cursor: "pointer",
  fontWeight: 700,
};

export const Autocomplete: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const options = normalizeOptions(resolvedProps.options);
  const [value, setValue] = useState(String(resolvedProps.value ?? ""));
  const [open, setOpen] = useState(false);
  const { emit } = useComponentEvents(comp);
  const filtered = useMemo(() => {
    const query = value.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query)).slice(0, 12);
  }, [options, value]);

  return (
    <label style={{ ...labelStyle, position: "relative" }}>
      {resolvedProps.label as string | undefined}
      <input
        name={resolvedProps.name as string | undefined}
        value={value}
        placeholder={(resolvedProps.placeholder as string) ?? ""}
        onFocus={() => setOpen(true)}
        onChange={(event) => { setValue(event.target.value); setOpen(true); emit("search", { query: event.target.value }); }}
        style={fieldBase}
      />
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, marginTop: 4, border: "1px solid var(--air-border)", borderRadius: 8, background: "var(--air-surface)", boxShadow: "var(--air-shadow)", overflow: "hidden" }}>
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => { setValue(option.label); setOpen(false); emit("select", { value: option.value, label: option.label }); }}
              style={{ display: "block", width: "100%", padding: "8px 12px", border: "none", background: "transparent", color: "var(--air-text)", textAlign: "left", cursor: option.disabled ? "not-allowed" : "pointer", opacity: option.disabled ? 0.5 : 1 }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </label>
  );
};

export const MultiSelect: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const options = normalizeOptions(resolvedProps.options);
  const initial = Array.isArray(resolvedProps.value) ? resolvedProps.value.map(String) : [];
  const [selected, setSelected] = useState<string[]>(initial);
  const [open, setOpen] = useState(false);
  const { emit } = useComponentEvents(comp);

  const toggle = (value: string) => {
    const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
    setSelected(next);
    emit("change", { value: next });
  };

  return (
    <label style={{ ...labelStyle, position: "relative" }}>
      {resolvedProps.label as string | undefined}
      <button type="button" onClick={() => setOpen(!open)} style={{ ...fieldBase, minHeight: 40, textAlign: "left", cursor: "pointer" }}>
        {selected.length === 0 ? (
          <span style={{ color: "var(--air-textMuted)" }}>{(resolvedProps.placeholder as string) ?? "Select..."}</span>
        ) : (
          <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {selected.map((value) => <span key={value} style={{ padding: "2px 8px", borderRadius: 20, background: "var(--air-accentSubtle)", color: "var(--air-accent)", fontSize: 12 }}>{options.find((option) => option.value === value)?.label ?? value}</span>)}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, marginTop: 4, border: "1px solid var(--air-border)", borderRadius: 8, background: "var(--air-surface)", boxShadow: "var(--air-shadow)", overflow: "hidden" }}>
          {options.map((option) => (
            <label key={option.value} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", cursor: option.disabled ? "not-allowed" : "pointer", opacity: option.disabled ? 0.5 : 1 }}>
              <input type="checkbox" disabled={option.disabled} checked={selected.includes(option.value)} onChange={() => toggle(option.value)} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </label>
  );
};

export const FileUpload: FC<{ comp: Component; resolvedProps: Record<string, unknown> }> = ({ comp, resolvedProps }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Array<{ name: string; size: number; type: string }>>([]);
  const { emit } = useComponentEvents(comp);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {resolvedProps.label ? <div style={{ fontSize: 13, fontWeight: 600, color: "var(--air-text)" }}>{String(resolvedProps.label)}</div> : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{ minHeight: 96, border: "1px dashed var(--air-border)", borderRadius: 10, background: "var(--air-surfaceAlt)", color: "var(--air-textSecondary)", cursor: "pointer", fontWeight: 600 }}
      >
        {(resolvedProps.prompt as string) ?? "Choose files"}
      </button>
      <input
        ref={inputRef}
        type="file"
        name={resolvedProps.name as string | undefined}
        multiple={(resolvedProps.multiple as boolean | undefined) ?? false}
        accept={resolvedProps.accept as string | undefined}
        style={{ display: "none" }}
        onChange={(event) => {
          const next = Array.from(event.target.files ?? []).map((file) => ({ name: file.name, size: file.size, type: file.type }));
          setFiles(next);
          emit("change", { files: next });
        }}
      />
      {files.length > 0 && (
        <div style={{ display: "grid", gap: 4 }}>
          {files.map((file) => <div key={file.name} style={{ fontSize: 12, color: "var(--air-textSecondary)" }}>{file.name} ({Math.round(file.size / 1024)} KB)</div>)}
        </div>
      )}
    </div>
  );
};
