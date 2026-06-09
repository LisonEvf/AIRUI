import { describe, it, expect } from "vitest";
import { BUILTIN_COMPONENTS } from "../src/types";
import { validateDocument } from "../src/validator";

const RENDERER_BUILTINS = [
  "Column", "Row", "Divider", "Text",
  "Button", "Input", "Select", "Switch", "Checkbox", "Radio", "Slider", "Image", "Dropdown",
  "Form", "Textarea", "DatePicker", "TimePicker", "DateRangePicker", "NumberInput", "Autocomplete", "MultiSelect", "FileUpload",
  "Video", "Audio", "ImageGallery", "Carousel", "Lightbox", "PDFViewer",
  "KPI", "PlateCard", "Gauge", "Progress", "Tag", "Badge", "Avatar", "Skeleton",
  "Table", "Pagination", "DataGrid", "EmptyState", "Chart",
  "Tabs", "Breadcrumb", "Steps",
  "Modal", "Drawer", "DropdownMenu",
  "Alert", "Loading", "ErrorFallback", "Tooltip", "Toast", "Notification", "Popconfirm", "ContextMenu", "CommandPalette",
  "Dashboard", "Widget", "Accordion", "Timeline", "Tree",
  "AppShell", "Sidebar", "TopNav", "Toolbar", "SplitPane", "ScrollArea",
  "Markdown", "CodeBlock", "RichText", "Icon",
  "Calendar", "Kanban", "Map", "NetworkGraph", "Heatmap",
];

describe("BUILTIN_COMPONENTS", () => {
  it("matches the renderer-react built-in capability set", () => {
    expect(BUILTIN_COMPONENTS).toEqual(RENDERER_BUILTINS);
  });

  it("exposes previously missing app-artifact components after renderer support lands", () => {
    expect(BUILTIN_COMPONENTS).toContain("Video");
    expect(BUILTIN_COMPONENTS).toContain("EmptyState");
    expect(BUILTIN_COMPONENTS).toContain("CommandPalette");
  });

  it("does not expose components without renderer implementations", () => {
    expect(BUILTIN_COMPONENTS).not.toContain("MiniChart");
  });
});

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
