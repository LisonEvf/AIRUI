import type { AirUIDocument, Component, EventHandler } from "./types";

// ── Document Validation ──

export interface ValidationError {
  path: string;
  message: string;
}

export function validateDocument(doc: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!doc || typeof doc !== "object") {
    errors.push({ path: "", message: "Document must be an object" });
    return errors;
  }

  const d = doc as Record<string, unknown>;

  if (d.schema !== "air-ui@1") {
    errors.push({ path: "schema", message: 'schema must be "air-ui@1"' });
  }

  if (!d.viewport || typeof d.viewport !== "object") {
    errors.push({ path: "viewport", message: "viewport is required" });
  } else {
    const vp = d.viewport as Record<string, unknown>;
    if (typeof vp.width !== "number") errors.push({ path: "viewport.width", message: "must be number" });
    if (typeof vp.height !== "number") errors.push({ path: "viewport.height", message: "must be number" });
  }

  if (!d.state || typeof d.state !== "object") {
    errors.push({ path: "state", message: "state must be an object" });
  }

  if (!d.root) {
    errors.push({ path: "root", message: "root component is required" });
  } else {
    errors.push(...validateComponent(d.root as Component, "root"));
  }

  if (d.components && typeof d.components === "object") {
    for (const [name, def] of Object.entries(d.components)) {
      errors.push(...validateComponent(def as Component, `components.${name}`));
    }
  }

  return errors;
}

function validateComponent(comp: Component, basePath: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!comp.type || typeof comp.type !== "string") {
    errors.push({ path: `${basePath}.type`, message: "type is required string" });
  }

  if (comp.props && typeof comp.props !== "object") {
    errors.push({ path: `${basePath}.props`, message: "props must be object" });
  }

  if (comp.state && typeof comp.state !== "object") {
    errors.push({ path: `${basePath}.state`, message: "state must be object" });
  }

  if (comp.children) {
    if (!Array.isArray(comp.children)) {
      errors.push({ path: `${basePath}.children`, message: "children must be array" });
    } else {
      comp.children.forEach((child, i) => {
        errors.push(...validateComponent(child, `${basePath}.children.${i}`));
      });
    }
  }

  if (comp.on && typeof comp.on === "object") {
    for (const [event, handler] of Object.entries(comp.on)) {
      errors.push(...validateEventHandler(handler as EventHandler, `${basePath}.on.${event}`));
    }
  }

  return errors;
}

function validateEventHandler(handler: EventHandler, basePath: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const validActions = ["mutate", "set", "emit", "call"];

  if (!handler.action || !validActions.includes(handler.action)) {
    errors.push({ path: `${basePath}.action`, message: `action must be one of: ${validActions.join(", ")}` });
  }

  if (handler.action === "mutate" && typeof handler.by !== "number") {
    errors.push({ path: `${basePath}.by`, message: "mutate requires numeric 'by'" });
  }

  if (handler.action === "set" && handler.value === undefined) {
    errors.push({ path: `${basePath}.value`, message: "set requires 'value'" });
  }

  if (handler.action === "emit" && !handler.event) {
    errors.push({ path: `${basePath}.event`, message: "emit requires 'event'" });
  }

  if (handler.action === "call" && !handler.function) {
    errors.push({ path: `${basePath}.function`, message: "call requires 'function'" });
  }

  return errors;
}
