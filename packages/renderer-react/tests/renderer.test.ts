import { describe, it, expect } from "vitest";
import { applyPatches } from "@air-ui/core";
import type { AirUIDocument } from "@air-ui/core";

describe("renderer-react integration", () => {
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
