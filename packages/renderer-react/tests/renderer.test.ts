import { describe, it, expect } from "vitest";
import { applyPatches } from "@air-ui/core";
import type { AirUIDocument } from "@air-ui/core";
import { BUILTIN_COMPONENTS } from "../../core/src/types";
import * as components from "../src/components";

const NON_COMPONENT_EXPORTS = new Set(["AirUIComponent"]);

describe("renderer-react integration", () => {
  it("exports every core built-in component renderer", () => {
    const exportedComponents = Object.keys(components).filter((name) => !NON_COMPONENT_EXPORTS.has(name));
    expect(exportedComponents.sort()).toEqual([...BUILTIN_COMPONENTS].sort());
  });

  it("applyPatch through store should work", () => {
    const doc: AirUIDocument = {
      schema: "air-ui@1",
      viewport: { width: 300, height: 200 },
      state: { count: 0 },
      root: { type: "Column", children: [{ type: "Text", props: { value: "Hello" } }] },
    };
    const result = applyPatches(doc, [
      { op: "update-state", stateDelta: { count: 42 } },
    ]);
    expect(result.state.count).toBe(42);
  });
});
