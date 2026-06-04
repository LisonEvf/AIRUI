import type { EventHandler } from "@air-ui/core";

export type HostFunction = (...args: unknown[]) => unknown;

const hostFunctions = new Map<string, HostFunction>();

export function registerHostFunction(name: string, fn: HostFunction) {
  hostFunctions.set(name, fn);
}

export function getHostFunction(name: string): HostFunction | undefined {
  return hostFunctions.get(name);
}

export function emitAirUIEvent(detail: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("air-ui-event", { detail }));
  }
}

export function handleEvent(
  handler: EventHandler | undefined,
  eventData: Record<string, unknown>,
  state: Record<string, unknown>,
  setState: (newState: Record<string, unknown>) => void,
) {
  if (!handler) return;

  const { action } = handler;

  switch (action) {
    case "mutate": {
      if (!handler.target || handler.by === undefined) return;
      const current = getByPath(state, handler.target);
      if (typeof current === "number") {
        const newState = setByPath(state, handler.target, current + handler.by);
        setState(newState);
      }
      break;
    }
    case "set": {
      if (!handler.target || handler.value === undefined) return;
      const resolved = resolveEventRefs(handler.value, eventData);
      const newState = setByPath(state, handler.target, resolved);
      setState(newState);
      break;
    }
    case "emit": {
      if (handler.event) emitAirUIEvent(handler.event);
      break;
    }
    case "call": {
      if (handler.function) {
        const fn = getHostFunction(handler.function);
        fn?.(...(handler.args ?? []));
      }
      break;
    }
  }
}

// Inline helpers (mirrors @air-ui/core/state but avoids import at hot path)
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const segments = path.replace(/^@?state\./, "").split(".");
  let current: unknown = obj;
  for (const seg of segments) {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const segments = path.replace(/^@?state\./, "").split(".");
  const result = structuredClone(obj);
  let current: Record<string, unknown> = result;
  for (let i = 0; i < segments.length - 1; i++) {
    if (!(segments[i] in current) || typeof current[segments[i]] !== "object") {
      current[segments[i]] = {};
    }
    current = current[segments[i]] as Record<string, unknown>;
  }
  current[segments[segments.length - 1]] = value;
  return result;
}

function resolveEventRefs(value: unknown, eventData: Record<string, unknown>): unknown {
  if (typeof value === "string" && value.startsWith("$event.")) {
    return eventData[value.slice(7)];
  }
  return value;
}
