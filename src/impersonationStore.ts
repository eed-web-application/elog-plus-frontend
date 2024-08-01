import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "./api";

export type ImpersonationState = {
  impersonating: User | null;
  impersonate: (user: User | null) => void;
};

export const useImpersonationStore = create<ImpersonationState>()(
  persist(
    (set) => ({
      impersonating: null,
      impersonate: (user: User | null) => set({ impersonating: user }),
    }),
    {
      name: "impersonation-storage", // name of item in the storage (must be unique)
      partialize: (state) => ({ impersonating: state.impersonating }),
    },
  ),
);
