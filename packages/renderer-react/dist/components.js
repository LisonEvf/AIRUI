import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { interpolate } from "@air-ui/core";
import { useAirUIStore } from "./store";
import { handleEvent } from "./host";
// ── Style Helpers ──
const gapMap = {
    small: "4px",
    medium: "8px",
    large: "16px",
};
const alignMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
};
function resolveGap(gap) {
    if (gap === undefined)
        return undefined;
    if (typeof gap === "number")
        return `${gap}px`;
    return gapMap[gap] ?? gap;
}
function resolveAlign(align) {
    return align ? (alignMap[align] ?? align) : undefined;
}
// ── Event Handler Hook ──
function useEventHandler(handler) {
    const doc = useAirUIStore((s) => s.doc);
    const setDoc = useAirUIStore((s) => s.setDoc);
    if (!handler || !doc)
        return undefined;
    return (eventData) => {
        handleEvent(handler, eventData ?? {}, doc.state, (newState) => {
            setDoc({ ...doc, state: newState });
        });
    };
}
// ── Built-in Components ──
export const Column = ({ comp, resolvedProps, }) => {
    return (_jsx("div", { style: {
            display: "flex",
            flexDirection: "column",
            gap: resolveGap(resolvedProps.gap),
            padding: resolveGap(resolvedProps.padding),
            alignItems: resolveAlign(resolvedProps.align),
        }, children: comp.children?.map((child, i) => (_jsx(AirUIComponent, { comp: child }, child.ref ?? i))) }));
};
export const Row = ({ comp, resolvedProps, }) => {
    return (_jsx("div", { style: {
            display: "flex",
            flexDirection: "row",
            gap: resolveGap(resolvedProps.gap),
            padding: resolveGap(resolvedProps.padding),
            alignItems: resolveAlign(resolvedProps.align),
        }, children: comp.children?.map((child, i) => (_jsx(AirUIComponent, { comp: child }, child.ref ?? i))) }));
};
export const Text = ({ resolvedProps, }) => {
    const doc = useAirUIStore((s) => s.doc);
    const value = resolvedProps.value;
    const text = doc ? interpolate(String(value ?? ""), doc.state) : String(value ?? "");
    const styleMap = {
        title: { fontSize: "1.5rem", fontWeight: "bold" },
        subtitle: { fontSize: "1.2rem", fontWeight: 600 },
        body: { fontSize: "1rem" },
        caption: { fontSize: "0.875rem", color: "#666" },
    };
    return _jsx("span", { style: styleMap[resolvedProps.style] ?? { fontSize: "1rem" }, children: text });
};
export const Button = ({ comp, resolvedProps, }) => {
    const onClick = useEventHandler(comp.on?.click);
    const disabled = resolvedProps.disabled;
    return (_jsx("button", { onClick: () => onClick?.(), disabled: disabled, style: {
            padding: "6px 16px",
            border: "1px solid #d0d0d0",
            borderRadius: "4px",
            background: disabled ? "#f0f0f0" : "#fff",
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: "14px",
        }, children: resolvedProps.label }));
};
export const Input = ({ comp, resolvedProps, }) => {
    const doc = useAirUIStore((s) => s.doc);
    const setDoc = useAirUIStore((s) => s.setDoc);
    const onChange = useEventHandler(comp.on?.change);
    const handleChange = (e) => {
        if (!doc || !comp.on?.change)
            return;
        const target = comp.on.change.target;
        if (target) {
            const newState = { ...doc.state };
            const segments = target.replace(/^@?state\./, "").split(".");
            let current = newState;
            for (let i = 0; i < segments.length - 1; i++) {
                if (typeof current[segments[i]] !== "object")
                    current[segments[i]] = {};
                current = current[segments[i]];
            }
            current[segments[segments.length - 1]] = e.target.value;
            setDoc({ ...doc, state: newState });
        }
        onChange?.({ value: e.target.value });
    };
    return (_jsx("input", { type: resolvedProps.type ?? "text", value: resolvedProps.value ?? "", placeholder: resolvedProps.placeholder ?? "", onChange: handleChange, style: {
            padding: "6px 12px",
            border: "1px solid #d0d0d0",
            borderRadius: "4px",
            fontSize: "14px",
        } }));
};
export const Image = ({ resolvedProps, }) => {
    return (_jsx("img", { src: resolvedProps.src, alt: resolvedProps.alt ?? "", style: { maxWidth: "100%", height: "auto" } }));
};
export const Dropdown = ({ comp, resolvedProps, }) => {
    const doc = useAirUIStore((s) => s.doc);
    const setDoc = useAirUIStore((s) => s.setDoc);
    const onChange = useEventHandler(comp.on?.change);
    const options = resolvedProps.options ?? [];
    const selected = resolvedProps.selected;
    const handleChange = (e) => {
        if (!doc)
            return;
        const target = comp.on?.change?.target;
        if (target) {
            const newState = { ...doc.state };
            const segments = target.replace(/^@?state\./, "").split(".");
            let current = newState;
            for (let i = 0; i < segments.length - 1; i++) {
                if (typeof current[segments[i]] !== "object")
                    current[segments[i]] = {};
                current = current[segments[i]];
            }
            current[segments[segments.length - 1]] = e.target.value;
            setDoc({ ...doc, state: newState });
        }
        onChange?.({ value: e.target.value });
    };
    return (_jsx("select", { value: selected ?? "", onChange: handleChange, style: { padding: "6px 12px", border: "1px solid #d0d0d0", borderRadius: "4px" }, children: options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) }));
};
// ── Render Engine ──
import { getRegisteredComponent } from "./registry";
export const AirUIComponent = ({ comp }) => {
    const doc = useAirUIStore((s) => s.doc);
    if (!doc)
        return null;
    // Resolve props: interpolate state references
    const resolvedProps = resolveProps(comp.props ?? {}, doc.state);
    // Check custom component registry first
    const customRenderer = getRegisteredComponent(comp.type);
    if (customRenderer) {
        const CustomComp = customRenderer;
        return _jsx(CustomComp, { comp: comp, resolvedProps: resolvedProps });
    }
    // Built-in component switch
    switch (comp.type) {
        case "Column":
            return _jsx(Column, { comp: comp, resolvedProps: resolvedProps });
        case "Row":
            return _jsx(Row, { comp: comp, resolvedProps: resolvedProps });
        case "Text":
            return _jsx(Text, { comp: comp, resolvedProps: resolvedProps });
        case "Button":
            return _jsx(Button, { comp: comp, resolvedProps: resolvedProps });
        case "Input":
            return _jsx(Input, { comp: comp, resolvedProps: resolvedProps });
        case "Image":
            return _jsx(Image, { comp: comp, resolvedProps: resolvedProps });
        case "Dropdown":
            return _jsx(Dropdown, { comp: comp, resolvedProps: resolvedProps });
        default:
            return _jsxs("div", { style: { color: "red" }, children: ["Unknown component: ", comp.type] });
    }
};
function resolveProps(props, state) {
    const resolved = {};
    for (const [key, value] of Object.entries(props)) {
        if (typeof value === "string" && value.startsWith("@state.")) {
            // Direct state reference
            const path = value.slice(7);
            const segments = path.split(".");
            let current = state;
            for (const seg of segments) {
                if (current === null || current === undefined || typeof current !== "object") {
                    current = undefined;
                    break;
                }
                current = current[seg];
            }
            resolved[key] = current;
        }
        else {
            resolved[key] = value;
        }
    }
    return resolved;
}
//# sourceMappingURL=components.js.map