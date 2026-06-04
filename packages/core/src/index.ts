export type {
  AirUIDocument,
  Component,
  ComponentDefinition,
  EventHandler,
  EventAction,
  EventMap,
  Patch,
  PropDefinition,
  BuiltinComponent,
  StatePath,
} from "./types";

export { validateDocument, type ValidationError } from "./validator";
export {
  parseStatePath,
  getByPath,
  setByPath,
  interpolate,
  resolveEventRefs,
  applyPatch,
  applyPatches,
} from "./state";
