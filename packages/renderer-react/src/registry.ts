import type { ComponentType } from "react";
import type { Component } from "@air-ui/core";

export type ComponentRenderer<P = Record<string, unknown>> = ComponentType<{
  comp: Component;
  resolvedProps: P;
}>;

const registry = new Map<string, ComponentRenderer>();

export function registerComponent(type: string, renderer: ComponentRenderer) {
  registry.set(type, renderer);
}

export function getRegisteredComponent(type: string): ComponentRenderer | undefined {
  return registry.get(type);
}

export function getRegistry() {
  return registry;
}
