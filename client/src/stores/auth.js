// @ts-check
import { create } from "zustand"

/** @typedef {{ user: import('../types').User | null, status: import('../types').AuthStatus, setUser: (user: import('../types').User | null) => void, setUnavailable: () => void }} AuthState */

// No persistence: /me is the source of truth on every app boot.
export const useAuthStore = create(
  /** @returns {AuthState} */ (set) => ({
    user: null,
    status: "loading",
    setUser: (user) =>
      set({ user, status: user ? "authenticated" : "anonymous" }),
    setUnavailable: () =>
      set((state) => (state.user ? state : { status: "error" })),
  })
)
