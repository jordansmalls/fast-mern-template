"use client"

import { AuthGuard } from "@/components/auth-guard"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useUiStore } from "@/src/stores/ui"

export function AppShell({ children }: { children: React.ReactNode }) {
  const open = useUiStore((state) => state.sidebarOpen)
  const setOpen = useUiStore((state) => state.setSidebarOpen)
  return (
    <AuthGuard>
      <SidebarProvider
        open={open}
        onOpenChange={setOpen}
        style={{ "--sidebar-width": "15rem" } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="mx-auto w-full max-w-5xl space-y-8 p-5 md:p-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
