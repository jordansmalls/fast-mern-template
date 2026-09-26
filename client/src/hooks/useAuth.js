// @ts-check
"use client"
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { api, ApiError, waitForRefresh } from "../api/client.js"
import { authKey, clearSession, setSession } from "../lib/query-client.js"
export { useAuthStore } from "../stores/auth.js"
export { getErrorMessage } from "../api/client.js"

export function useAuth() {
  const busy = useAuthBusy()
  return useQuery({
    queryKey: authKey,
    enabled: !busy,
    /** @returns {Promise<import('../types').AuthResponse | null>} */
    queryFn: async ({ signal }) => {
      try {
        return (await api.get("/api/auth/me", { signal })).data
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    staleTime: 60_000,
  })
}

/** @param {"login" | "signup"} action */
function useCredentialsMutation(action) {
  const client = useQueryClient()
  return useMutation({
    mutationKey: ["auth", action],
    scope: { id: "auth" },
    onMutate: async () => {
      await client.cancelQueries()
      await waitForRefresh()
    },
    /** @param {import('../types').Credentials} credentials @returns {Promise<import('../types').AuthResponse>} */
    mutationFn: async (credentials) =>
      (await api.post(`/api/auth/${action}`, credentials)).data,
    onSuccess: async (response) => {
      await clearSession(client)
      setSession(client, response)
    },
  })
}
export function useLogin() {
  return useCredentialsMutation("login")
}
export function useSignup() {
  return useCredentialsMutation("signup")
}

export function useUpdateAccount() {
  const client = useQueryClient()
  return useMutation({
    mutationKey: ["auth", "update"],
    scope: { id: "auth" },
    onMutate: () => client.cancelQueries({ queryKey: authKey }),
    /** @param {import('../types').AccountUpdate} updates @returns {Promise<import('../types').AuthResponse>} */
    mutationFn: async (updates) =>
      (await api.patch("/api/auth/me", updates)).data,
    onSuccess: (response) => {
      setSession(client, response)
    },
  })
}

/** @param {"logout" | "delete"} action */
function useEndSession(action) {
  const client = useQueryClient()
  return useMutation({
    mutationKey: ["auth", action],
    scope: { id: "auth" },
    onMutate: async () => {
      await client.cancelQueries()
      await waitForRefresh()
    },
    /** @returns {Promise<import('../types').MessageResponse>} */
    mutationFn: async () =>
      (action === "logout"
        ? await api.post("/api/auth/logout")
        : await api.delete("/api/auth/me")
      ).data,
    onSuccess: () => clearSession(client),
  })
}
export function useLogout() {
  return useEndSession("logout")
}
export function useDeleteAccount() {
  return useEndSession("delete")
}
export function useAuthBusy() {
  return useIsMutating({ mutationKey: ["auth"] }) > 0
}

/** @param {string} email @param {boolean} [enabled] */
export function useEmailAvailable(email, enabled = false) {
  return useQuery({
    queryKey: ["email-available", email.trim().toLowerCase()],
    enabled: enabled && email.includes("@"),
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api.get("/api/auth/email-available", {
          params: { email },
          signal,
        })
        return /** @type {{ available: boolean, message: string }} */ (data)
      } catch (error) {
        if (error instanceof ApiError && error.status === 409)
          return { available: false, message: error.message }
        throw error
      }
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
}
