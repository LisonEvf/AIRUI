import type { Patch, AirUIDocument } from "./types";
/** Parse a state path like "state.counter" or "@state.foo.bar" into segments */
export declare function parseStatePath(path: string): string[];
/** Get value from object by dot path */
export declare function getByPath(obj: Record<string, unknown>, path: string): unknown;
/** Set value in object by dot path, returns new object (immutable) */
export declare function setByPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown>;
/** Interpolate `{state.xxx}` in string templates */
export declare function interpolate(template: string, state: Record<string, unknown>): string;
/** Resolve `$event.xxx` references in values */
export declare function resolveEventRefs(value: unknown, eventData: Record<string, unknown>): unknown;
/** Apply a single patch to a document, returns new document */
export declare function applyPatch(doc: AirUIDocument, patch: Patch): AirUIDocument;
/** Apply multiple patches sequentially */
export declare function applyPatches(doc: AirUIDocument, patches: Patch[]): AirUIDocument;
//# sourceMappingURL=state.d.ts.map