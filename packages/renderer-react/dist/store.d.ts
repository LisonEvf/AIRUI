import type { AirUIDocument, Patch } from "@air-ui/core";
export interface AirUIState {
    doc: AirUIDocument | null;
    setDoc: (doc: AirUIDocument) => void;
    applyPatch: (patches: Patch[]) => void;
}
export declare const useAirUIStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AirUIState>>;
//# sourceMappingURL=store.d.ts.map