const registry = new Map();
export function registerComponent(type, renderer) {
    registry.set(type, renderer);
}
export function getRegisteredComponent(type) {
    return registry.get(type);
}
export function getRegistry() {
    return registry;
}
//# sourceMappingURL=registry.js.map