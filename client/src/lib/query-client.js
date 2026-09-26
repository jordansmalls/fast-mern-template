// @ts-check
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getErrorMessage } from "../api/client.js"
import { useAuthStore } from "../stores/auth.js"

export const authKey = ["auth", "me"]
/** @param {readonly unknown[]} key */
const isAuthKey = (key) => key[0] === "auth" && key[1] === "me"

export function createQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => toast.error(getErrorMessage(error)),
    }),
    queryCache: new QueryCache({
      onSuccess: (data, query) => {
        if (isAuthKey(query.queryKey)) {
          const response =
            /** @type {import('../types').AuthResponse | null} */ (data)
          useAuthStore.getState().setUser(response?.user ?? null)
        }
      },
      onError: (_error, query) => {
        if (isAuthKey(query.queryKey)) useAuthStore.getState().setUnavailable()
      },
    }),
    defaultOptions: {
      queries: { staleTime: 30_000, retry: false },
      mutations: { retry: false, gcTime: 0 },
    },
  })
}

/** @param {QueryClient} client @param {import('../types').AuthResponse | null} response */
export function setSession(client, response) {
  client.setQueryData(authKey, response)
  useAuthStore.getState().setUser(response?.user ?? null)
}

/** @param {QueryClient} client */
export async function clearSession(client) {
  await client.cancelQueries()
  // Remove account-scoped data before another user can sign in.
  client.removeQueries({
    predicate: (query) =>
      !isAuthKey(query.queryKey) && query.queryKey[0] !== "health",
  })
  setSession(client, null)
}
