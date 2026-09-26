// @ts-check
import { create } from "zustand"

/** @typedef {{ sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }} UiState */
export const useUiStore = create(
  /** @returns {UiState} */ (set) => ({
    sidebarOpen: true,
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  })
)
