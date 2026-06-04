import { useState, useCallback, useEffect } from "react";
import { useAirUIStore, AirUIComponent } from "@air-ui/renderer-react";
import { validateDocument } from "@air-ui/core";
import type { AirUIDocument, Patch } from "@air-ui/core";

const EXAMPLES: Record<string, string> = {
  counter: `{
  "schema": "air-ui@1",
  "viewport": { "width": 300, "height": 200 },
  "state": { "count": 0 },
  "root": {
    "type": "Column",
    "props": { "gap": "medium", "align": "center" },
    "children": [
      {
        "type": "Text",
        "props": { "value": "Count: {state.count}", "style": "title" }
      },
      {
        "type": "Row",
        "props": { "gap": "small" },
        "children": [
          {
            "type": "Button",
            "props": { "label": "-" },
            "on": { "click": { "action": "mutate", "target": "state.count", "by": -1 } }
          },
          {
            "type": "Button",
            "props": { "label": "+" },
            "on": { "click": { "action": "mutate", "target": "state.count", "by": 1 } }
          }
        ]
      },
      {
        "type": "Text",
        "props": { "value": "Click buttons to change count", "style": "caption" }
      }
    ]
  }
}`,
  form: `{
  "schema": "air-ui@1",
  "viewport": { "width": 400, "height": 500 },
  "state": { "name": "", "submitted": false },
  "root": {
    "type": "Column",
    "props": { "gap": "medium", "padding": "large" },
    "children": [
      {
        "type": "Text",
        "props": { "value": "Simple Form", "style": "title" }
      },
      {
        "type": "Column",
        "props": { "gap": "small" },
        "children": [
          { "type": "Text", "props": { "value": "Name" } },
          {
            "type": "Input",
            "props": { "placeholder": "Enter your name" },
            "on": { "change": { "action": "set", "target": "state.name", "value": "$event.value" } }
          }
        ]
      },
      {
        "type": "Text",
        "props": { "value": "Hello, {state.name}!", "style": "subtitle" }
      }
    ]
  }
}`,
};

const PATCH_EXAMPLE = `[
  { "op": "update-state", "stateDelta": { "count": 42 } }
]`;

export function Playground() {
  const [jsonInput, setJsonInput] = useState(EXAMPLES.counter);
  const [patchInput, setPatchInput] = useState(PATCH_EXAMPLE);
  const [errors, setErrors] = useState<string[]>([]);
  const [patchError, setPatchError] = useState("");
  const store = useAirUIStore();

  const loadExample = useCallback((name: string) => {
    setJsonInput(EXAMPLES[name] ?? "");
    setErrors([]);
  }, []);

  const applyDocument = useCallback(() => {
    try {
      const doc = JSON.parse(jsonInput) as AirUIDocument;
      const validationErrors = validateDocument(doc);
      if (validationErrors.length > 0) {
        setErrors(validationErrors.map((e) => `${e.path}: ${e.message}`));
        return;
      }
      setErrors([]);
      store.setDoc(doc);
    } catch (e) {
      setErrors([`JSON parse error: ${(e as Error).message}`]);
    }
  }, [jsonInput, store]);

  const applyPatch = useCallback(() => {
    try {
      const patches = JSON.parse(patchInput) as Patch[];
      setPatchError("");
      store.applyPatch(patches);
    } catch (e) {
      setPatchError(`Patch parse error: ${(e as Error).message}`);
    }
  }, [patchInput, store]);

  // Auto-apply on first load
  useEffect(() => {
    applyDocument();
  }, []);

  // Listen for air-ui events
  useEffect(() => {
    const handler = (e: Event) => {
      console.log("AIR-UI Event:", (e as CustomEvent).detail);
    };
    window.addEventListener("air-ui-event", handler);
    return () => window.removeEventListener("air-ui-event", handler);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left Panel: Editor */}
      <div style={{ width: "50%", display: "flex", flexDirection: "column", borderRight: "1px solid #e0e0e0" }}>
        {/* Toolbar */}
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #e0e0e0", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontWeight: "bold", marginRight: 8 }}>AIR-UI Playground</span>
          {Object.keys(EXAMPLES).map((name) => (
            <button
              key={name}
              onClick={() => loadExample(name)}
              style={{ padding: "4px 12px", cursor: "pointer", border: "1px solid #ccc", borderRadius: 4, background: "#f8f8f8" }}
            >
              {name}
            </button>
          ))}
          <button
            onClick={applyDocument}
            style={{ padding: "4px 12px", cursor: "pointer", border: "none", borderRadius: 4, background: "#4CAF50", color: "#fff", marginLeft: "auto" }}
          >
            Render
          </button>
        </div>

        {/* JSON Editor */}
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          style={{
            flex: 1,
            fontFamily: "monospace",
            fontSize: 13,
            padding: 12,
            border: "none",
            resize: "none",
            outline: "none",
          }}
          spellCheck={false}
        />

        {/* Patch Input */}
        <div style={{ borderTop: "1px solid #e0e0e0" }}>
          <div style={{ padding: "8px 12px", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Patch (JSON):</span>
            <button
              onClick={applyPatch}
              style={{ padding: "2px 10px", cursor: "pointer", border: "none", borderRadius: 4, background: "#2196F3", color: "#fff", fontSize: 12 }}
            >
              Apply Patch
            </button>
            {patchError && <span style={{ color: "red", fontSize: 12 }}>{patchError}</span>}
          </div>
          <textarea
            value={patchInput}
            onChange={(e) => setPatchInput(e.target.value)}
            style={{
              height: 80,
              width: "100%",
              fontFamily: "monospace",
              fontSize: 12,
              padding: 8,
              border: "none",
              borderTop: "1px solid #e0e0e0",
              resize: "none",
              outline: "none",
            }}
            spellCheck={false}
          />
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div style={{ padding: 8, background: "#fff3f3", borderTop: "1px solid #fcc" }}>
            {errors.map((e, i) => (
              <div key={i} style={{ color: "red", fontSize: 12 }}>{e}</div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel: Preview */}
      <div style={{ width: "50%", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #e0e0e0", fontWeight: 600, fontSize: 12, color: "#666" }}>
          Preview
          {store.doc && (
            <span style={{ marginLeft: 8, color: "#999" }}>
              {store.doc.viewport.width}×{store.doc.viewport.height}
            </span>
          )}
        </div>
        <div style={{ flex: 1, padding: 24, overflow: "auto", background: "#fafafa" }}>
          {store.doc ? (
            <AirUIComponent comp={store.doc.root} />
          ) : (
            <div style={{ color: "#999", textAlign: "center", marginTop: 40 }}>
              Enter AIR-UI JSON and click Render
            </div>
          )}
        </div>
        {/* State Inspector */}
        {store.doc && (
          <div style={{ borderTop: "1px solid #e0e0e0", maxHeight: 200, overflow: "auto" }}>
            <div style={{ padding: "8px 12px", fontWeight: 600, fontSize: 12, color: "#666" }}>State</div>
            <pre style={{ padding: "8px 12px", fontSize: 12, fontFamily: "monospace", margin: 0 }}>
              {JSON.stringify(store.doc.state, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
