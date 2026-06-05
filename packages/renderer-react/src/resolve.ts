import { getByPath, interpolate } from "@air-ui/core";

export function resolveProps(
  props: Record<string, unknown>,
  state: Record<string, unknown>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string") {
      if (value.startsWith("@state.")) {
        resolved[key] = getByPath(state, value.slice(7));
      } else if (value.includes("{state.")) {
        resolved[key] = interpolate(value, state);
      } else {
        resolved[key] = value;
      }
    } else if (Array.isArray(value)) {
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
