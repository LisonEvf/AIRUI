import { create } from "zustand";
import { applyPatches } from "@air-ui/core";
export const useAirUIStore = create((set, get) => ({
    doc: null,
    setDoc: (doc) => set({ doc }),
    applyPatch: (patches) => {
        const { doc } = get();
        if (!doc)
            return;
        set({ doc: applyPatches(doc, patches) });
    },
}));
//# sourceMappingURL=store.js.map