const hostFunctions = new Map();
export function registerHostFunction(name, fn) {
    hostFunctions.set(name, fn);
}
export function getHostFunction(name) {
    return hostFunctions.get(name);
}
export function emitAirUIEvent(detail) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("air-ui-event", { detail }));
    }
}
export function handleEvent(handler, eventData, state, setState) {
    if (!handler)
        return;
    const { action } = handler;
    switch (action) {
        case "mutate": {
            if (!handler.target || handler.by === undefined)
                return;
            const current = getByPath(state, handler.target);
            if (typeof current === "number") {
                const newState = setByPath(state, handler.target, current + handler.by);
                setState(newState);
            }
            break;
        }
        case "set": {
            if (!handler.target || handler.value === undefined)
                return;
            const resolved = resolveEventRefs(handler.value, eventData);
            const newState = setByPath(state, handler.target, resolved);
            setState(newState);
            break;
        }
        case "emit": {
            if (handler.event)
                emitAirUIEvent(handler.event);
            break;
        }
        case "call": {
            if (handler.function) {
                const fn = getHostFunction(handler.function);
                fn?.(...(handler.args ?? []));
            }
            break;
        }
    }
}
// Inline helpers (mirrors @air-ui/core/state but avoids import at hot path)
function getByPath(obj, path) {
    const segments = path.replace(/^@?state\./, "").split(".");
    let current = obj;
    for (const seg of segments) {
        if (current === null || current === undefined || typeof current !== "object")
            return undefined;
        current = current[seg];
    }
    return current;
}
function setByPath(obj, path, value) {
    const segments = path.replace(/^@?state\./, "").split(".");
    const result = structuredClone(obj);
    let current = result;
    for (let i = 0; i < segments.length - 1; i++) {
        if (!(segments[i] in current) || typeof current[segments[i]] !== "object") {
            current[segments[i]] = {};
        }
        current = current[segments[i]];
    }
    current[segments[segments.length - 1]] = value;
    return result;
}
function resolveEventRefs(value, eventData) {
    if (typeof value === "string" && value.startsWith("$event.")) {
        return eventData[value.slice(7)];
    }
    return value;
}
//# sourceMappingURL=host.js.map