"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getErrorMessage, useAuth, useAuthStore } from "@/src/hooks/useAuth"

export function AuthGuard({
  children,
  guest = false,
}: {
  children: React.ReactNode
  guest?: boolean
}) {
  const status = useAuthStore((state) => state.status)
  const auth = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const redirect = guest ? status === "authenticated" : status === "anonymous"

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next")
    if (redirect)
      router.replace(
        guest
          ? next === "/settings"
            ? "/settings"
            : "/"
          : `/login?next=${encodeURIComponent(pathname)}`
      )
  }, [redirect, guest, pathname, router])

  if (status === "loading" || redirect) {
    return (
      <div
        className="flex min-h-svh items-center justify-center text-sm text-muted-foreground"
        role="status"
      >
        Checking your session…
      </div>
    )
  }

  if (status === "error" && !guest) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="max-w-sm space-y-4 text-center">
          <h1 className="text-xl font-semibold">Unable to load your account</h1>
          <p className="text-sm text-muted-foreground" role="alert">
            {getErrorMessage(auth.error)}
          </p>
          <Button
            onClick={() => void auth.refetch()}
            disabled={auth.isFetching}
          >
            {auth.isFetching ? "Trying again…" : "Try again"}
          </Button>
        </div>
      </main>
    )
  }

  return children
}
