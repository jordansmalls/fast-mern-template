"use client"

import { useEffect, useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { useAuth } from "@/src/hooks/useAuth"
import { onSessionExpired } from "@/src/api/client"
import { clearSession, createQueryClient } from "@/src/lib/query-client"

function AuthBootstrap() {
  useAuth()
  return null
}

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient)

  useEffect(
    () =>
      onSessionExpired(() => {
        void clearSession(client)
      }),
    [client]
  )

  return (
    <QueryClientProvider client={client}>
      <AuthBootstrap />
      {children}
    </QueryClientProvider>
  )
}
