import { describe, it, expect } from "vitest";
import { validateDocument } from "../src/validator";

describe("validateDocument", () => {
  it("should reject non-object input", () => {
    expect(validateDocument(null)).toHaveLength(1);
    expect(validateDocument("string")).toHaveLength(1);
  });

  it("should validate a correct document", () => {
    const doc = {
      schema: "air-ui@1",
      viewport: { width: 300, height: 200 },
      state: { count: 0 },
      root: { type: "Column", children: [] },
    };
    expect(validateDocument(doc)).toHaveLength(0);
  });

  it("should catch invalid schema version", () => {
    const doc = {
      schema: "wrong",
      viewport: { width: 300, height: 200 },
      state: {},
      root: { type: "Column" },
    };
    const errors = validateDocument(doc);
    expect(errors).toHaveLength(1);
    expect(errors[0].path).toBe("schema");
  });

  it("should catch missing root", () => {
    const doc = {
      schema: "air-ui@1",
      viewport: { width: 300, height: 200 },
      state: {},
    };
    const errors = validateDocument(doc);
    expect(errors.some((e) => e.path === "root")).toBe(true);
  });

  it("should validate event handlers", () => {
    const doc = {
      schema: "air-ui@1",
      viewport: { width: 300, height: 200 },
      state: { count: 0 },
      root: {
        type: "Button",
        on: {
          click: { action: "mutate", target: "state.count", by: 1 },
        },
      },
    };
    expect(validateDocument(doc)).toHaveLength(0);
  });

  it("should catch invalid event action", () => {
    const doc = {
      schema: "air-ui@1",
      viewport: { width: 300, height: 200 },
      state: {},
      root: {
        type: "Button",
        on: { click: { action: "invalid" } },
      },
    };
    const errors = validateDocument(doc);
    expect(errors.some((e) => e.path.includes("action"))).toBe(true);
  });

  it("should catch emit without event", () => {
    const doc = {
      schema: "air-ui@1",
      viewport: { width: 300, height: 200 },
      state: {},
      root: {
        type: "Button",
        on: { click: { action: "emit" } },
      },
    };
    const errors = validateDocument(doc);
    expect(errors.some((e) => e.path.includes("event"))).toBe(true);
  });

  it("should validate nested children", () => {
    const doc = {
      schema: "air-ui@1",
      viewport: { width: 300, height: 200 },
      state: {},
      root: {
        type: "Column",
        children: [{ type: "Row" }, { type: "Text" }],
      },
    };
    expect(validateDocument(doc)).toHaveLength(0);
  });
});
