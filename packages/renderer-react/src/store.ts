import { create } from "zustand";
import type { AirUIDocument, Patch } from "@air-ui/core";
import { applyPatches } from "@air-ui/core";

export interface AirUIState {
  doc: AirUIDocument | null;
  setDoc: (doc: AirUIDocument) => void;
  applyPatch: (patches: Patch[]) => void;
}

export const useAirUIStore = create<AirUIState>((set, get) => ({
  doc: null,

  setDoc: (doc: AirUIDocument) => set({ doc }),

  applyPatch: (patches: Patch[]) => {
    const { doc } = get();
    if (!doc) return;
    set({ doc: applyPatches(doc, patches) });
  },
}));
