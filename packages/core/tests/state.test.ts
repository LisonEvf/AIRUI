import { describe, it, expect } from "vitest";
import {
  getByPath,
  setByPath,
  interpolate,
  resolveEventRefs,
  applyPatch,
  applyPatches,
} from "../src/state";
import type { AirUIDocument, Patch } from "../src/types";

describe("getByPath", () => {
  it("should get top-level value", () => {
    expect(getByPath({ count: 5 }, "state.count")).toBe(5);
  });

  it("should get nested value", () => {
    expect(getByPath({ user: { name: "Alice" } }, "state.user.name")).toBe("Alice");
  });

  it("should return undefined for missing path", () => {
    expect(getByPath({}, "state.foo")).toBeUndefined();
  });
});

describe("setByPath", () => {
  it("should set top-level value immutably", () => {
    const obj = { count: 0 };
    const result = setByPath(obj, "state.count", 5);
    expect(result.count).toBe(5);
    expect(obj.count).toBe(0); // original unchanged
  });

  it("should set nested value", () => {
    const obj = { user: { name: "Alice" } };
    const result = setByPath(obj, "state.user.name", "Bob");
    expect(result.user.name).toBe("Bob");
    expect(obj.user.name).toBe("Alice");
  });

  it("should create intermediate objects", () => {
    const obj: Record<string, unknown> = {};
    const result = setByPath(obj, "state.a.b.c", 42);
    expect((result.a as Record<string, unknown>).b as Record<string, unknown>).toHaveProperty("c", 42);
  });
});

describe("interpolate", () => {
  it("should interpolate state references", () => {
    expect(interpolate("Count: {state.count}", { count: 42 })).toBe("Count: 42");
  });

  it("should interpolate nested references", () => {
    expect(interpolate("Hello, {state.user.name}!", { user: { name: "Alice" } })).toBe(
      "Hello, Alice!",
    );
  });

  it("should leave unresolved references as-is", () => {
    expect(interpolate("Missing: {state.foo}", {})).toBe("Missing: {state.foo}");
  });
});

describe("resolveEventRefs", () => {
  it("should resolve $event references", () => {
    expect(resolveEventRefs("$event.value", { value: "hello" })).toBe("hello");
  });

  it("should pass through non-event values", () => {
    expect(resolveEventRefs("literal", {})).toBe("literal");
    expect(resolveEventRefs(42, {})).toBe(42);
  });
});

const sampleDoc: AirUIDocument = {
  schema: "air-ui@1",
  viewport: { width: 300, height: 200 },
  state: { count: 0, name: "World" },
  root: {
    type: "Column",
    children: [
      { type: "Text", props: { value: "Hello" } },
      { type: "Button", props: { label: "Click" } },
    ],
  },
};

describe("applyPatch", () => {
  it("should apply update-state patch", () => {
    const patch: Patch = { op: "update-state", stateDelta: { count: 5 } };
    const result = applyPatch(sampleDoc, patch);
    expect(result.state.count).toBe(5);
    expect(result.state.name).toBe("World"); // unchanged
  });

  it("should apply replace patch", () => {
    const patch: Patch = {
      op: "replace",
      path: "/root/children/0/props/value",
      value: "Changed",
    };
    const result = applyPatch(sampleDoc, patch);
    expect(result.root.children![0].props!.value).toBe("Changed");
    expect(sampleDoc.root.children![0].props!.value).toBe("Hello"); // original unchanged
  });

  it("should apply remove patch", () => {
    const patch: Patch = { op: "remove", path: "/root/children/1" };
    const result = applyPatch(sampleDoc, patch);
    expect(result.root.children).toHaveLength(1);
  });

  it("should apply add patch", () => {
    const patch: Patch = {
      op: "add",
      path: "/root/children",
      value: { type: "Text", props: { value: "Added" } },
    };
    const result = applyPatch(sampleDoc, patch);
    expect(result.root.children).toHaveLength(3);
  });
});

describe("applyPatches", () => {
  it("should apply multiple patches sequentially", () => {
    const patches: Patch[] = [
      { op: "update-state", stateDelta: { count: 1 } },
      { op: "update-state", stateDelta: { count: 2 } },
    ];
    const result = applyPatches(sampleDoc, patches);
    expect(result.state.count).toBe(2);
  });
});
