import type { ComponentType } from "react";
import type { Component } from "@air-ui/core";
export type ComponentRenderer<P = Record<string, unknown>> = ComponentType<{
    comp: Component;
    resolvedProps: P;
}>;
export declare function registerComponent(type: string, renderer: ComponentRenderer): void;
export declare function getRegisteredComponent(type: string): ComponentRenderer | undefined;
export declare function getRegistry(): Map<string, ComponentRenderer<Record<string, unknown>>>;
//# sourceMappingURL=registry.d.ts.map