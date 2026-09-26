// @ts-check
"use client"
import { useQuery } from "@tanstack/react-query"
import { api, API_URL } from "../api/client.js"
export { API_URL }

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    /** @returns {Promise<import('../types').HealthResponse>} */
    queryFn: async ({ signal }) => (await api.get("/health", { signal })).data,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}
