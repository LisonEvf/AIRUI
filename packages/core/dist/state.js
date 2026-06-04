// ── State Path Utilities ──
/** Parse a state path like "state.counter" or "@state.foo.bar" into segments */
export function parseStatePath(path) {
    const cleaned = path.replace(/^@?state\//, "").replace(/^@?state\./, "");
    return cleaned.split(/[./]/).filter(Boolean);
}
/** Get value from object by dot path */
export function getByPath(obj, path) {
    const segments = parseStatePath(path);
    let current = obj;
    for (const seg of segments) {
        if (current === null || current === undefined || typeof current !== "object")
            return undefined;
        current = current[seg];
    }
    return current;
}
/** Set value in object by dot path, returns new object (immutable) */
export function setByPath(obj, path, value) {
    const segments = parseStatePath(path);
    const result = structuredClone(obj);
    let current = result;
    for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i];
        if (!(seg in current) || typeof current[seg] !== "object" || current[seg] === null) {
            current[seg] = {};
        }
        current = current[seg];
    }
    current[segments[segments.length - 1]] = value;
    return result;
}
/** Interpolate `{state.xxx}` in string templates */
export function interpolate(template, state) {
    return template.replace(/\{state\.([\w.]+)\}/g, (_, path) => {
        const val = getByPath(state, path);
        return val !== undefined ? String(val) : `{state.${path}}`;
    });
}
/** Resolve `$event.xxx` references in values */
export function resolveEventRefs(value, eventData) {
    if (typeof value === "string" && value.startsWith("$event.")) {
        const key = value.slice(7);
        return eventData[key];
    }
    return value;
}
// ── Patch Application ──
/** Navigate into an object by slash-separated path segments */
function navigateToParent(obj, segments) {
    if (segments.length === 0)
        return null;
    let current = obj;
    for (let i = 0; i < segments.length - 1; i++) {
        if (current === null || current === undefined || typeof current !== "object")
            return null;
        current = current[segments[i]];
    }
    if (typeof current !== "object" || current === null)
        return null;
    return { parent: current, key: segments[segments.length - 1] };
}
/** Parse JSON Pointer path like "/root/children/0/props/value" */
function parseJsonPointer(path) {
    return path.split("/").filter(Boolean).map(s => s.replace(/~1/g, "/").replace(/~0/g, "~"));
}
/** Deep clone helper */
function cloneDeep(obj) {
    return structuredClone(obj);
}
/** Apply a single patch to a document, returns new document */
export function applyPatch(doc, patch) {
    const newDoc = cloneDeep(doc);
    switch (patch.op) {
        case "update-state": {
            Object.assign(newDoc.state, patch.stateDelta);
            break;
        }
        case "replace": {
            const segments = parseJsonPointer(patch.path);
            const target = navigateToParent(newDoc, segments);
            if (target)
                target.parent[target.key] = cloneDeep(patch.value);
            break;
        }
        case "add": {
            const segments = parseJsonPointer(patch.path);
            const target = navigateToParent(newDoc, segments);
            if (target) {
                if (Array.isArray(target.parent[target.key])) {
                    target.parent[target.key].push(cloneDeep(patch.value));
                }
                else {
                    target.parent[target.key] = cloneDeep(patch.value);
                }
            }
            break;
        }
        case "remove": {
            const segments = parseJsonPointer(patch.path);
            const target = navigateToParent(newDoc, segments);
            if (target) {
                if (Array.isArray(target.parent)) {
                    target.parent.splice(Number(target.key), 1);
                }
                else {
                    delete target.parent[target.key];
                }
            }
            break;
        }
    }
    return newDoc;
}
/** Apply multiple patches sequentially */
export function applyPatches(doc, patches) {
    return patches.reduce(applyPatch, doc);
}
//# sourceMappingURL=state.js.map