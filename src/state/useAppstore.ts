import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppState = {
  a4: number;
  setA4: (v: number) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      a4: 440,
      setA4: (v) => set({ a4: Math.min(446, Math.max(432, Math.round(v))) }),
    }),
    { name: "tuner-app-settings" }, // localStorage key
  ),
);
