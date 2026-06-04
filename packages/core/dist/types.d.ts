/** Global state path like `@state.foo` or `state.foo.bar` */
export type StatePath = string;
export type EventAction = "mutate" | "set" | "emit" | "call";
export interface EventHandler {
    /** Optional condition (natural language or expression) */
    when?: string;
    action: EventAction;
    /** State path for mutate/set, e.g. "state.counter" */
    target?: string;
    /** Delta for mutate action */
    by?: number;
    /** New value for set action (supports `$event.xxx` interpolation) */
    value?: unknown;
    /** Structured event payload for emit */
    event?: Record<string, unknown>;
    /** Host function name for call action */
    function?: string;
    /** Arguments for call action */
    args?: unknown[];
}
export type EventMap = Record<string, EventHandler>;
export interface Component {
    type: string;
    props?: Record<string, unknown>;
    state?: Record<string, unknown>;
    children?: Component[];
    slots?: Record<string, Component>;
    on?: EventMap;
    /** Reference id for parent access */
    ref?: string;
}
export interface ComponentDefinition {
    props?: Record<string, PropDefinition>;
    defaults?: Record<string, unknown>;
    children?: Component[];
}
export interface PropDefinition {
    type: "string" | "number" | "boolean" | "array" | "object";
    required?: boolean;
    default?: unknown;
}
export interface AirUIDocument {
    schema: "air-ui@1";
    viewport: {
        width: number;
        height: number;
    };
    state: Record<string, unknown>;
    root: Component;
    components?: Record<string, ComponentDefinition>;
}
export type Patch = {
    op: "replace";
    path: string;
    value: unknown;
} | {
    op: "add";
    path: string;
    value: unknown;
} | {
    op: "remove";
    path: string;
} | {
    op: "update-state";
    stateDelta: Record<string, unknown>;
};
export type BuiltinComponent = "Column" | "Row" | "Text" | "Button" | "Image" | "Input" | "Dropdown" | "Chart";
//# sourceMappingURL=types.d.ts.map