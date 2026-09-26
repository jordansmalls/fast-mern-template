"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  ChevronsUpDown,
  Sun,
  Moon,
  Monitor,
  User,
  Settings,
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuthBusy, useLogout } from "@/src/hooks/useAuth"
import { cn } from "@/lib/utils"

type NavUserInfo = {
  username?: string
  name?: string
  email?: string
  plan?: "free" | "starter"
} | null

export function NavUser({
  user,
  showEmail = true,
  showInitials = true,
  circularAvatar = false,
}: {
  user?: NavUserInfo
  showEmail?: boolean
  showInitials?: boolean
  circularAvatar?: boolean
}) {
  const { isMobile, setOpenMobile } = useSidebar()
  const { theme = "system", setTheme } = useTheme()
  const logout = useLogout()
  const busy = useAuthBusy()
  const displayName = user?.username || user?.name || "User"
  const displayEmail = user?.email || ""
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  const avatar = (
    <Avatar
      className={cn("size-8", circularAvatar ? "rounded-full" : "rounded-md")}
    >
      <AvatarFallback
        className={cn(
          "bg-[#0A36B2] text-xs font-semibold text-white",
          circularAvatar ? "rounded-full" : "rounded-md"
        )}
      >
        {showInitials ? initials : null}
      </AvatarFallback>
    </Avatar>
  )

  function handleLogout() {
    if (busy) return
    logout.mutate(undefined, {
      onSuccess: (response) =>
        toast.success("See you next time!", { description: response.message }),
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label="Account menu"
                className="aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
              />
            }
          >
            {avatar}
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              {showEmail && displayEmail && (
                <span className="truncate text-xs">{displayEmail}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  {avatar}
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    {displayEmail && (
                      <span className="truncate text-xs text-muted-foreground">
                        {displayEmail}
                      </span>
                    )}
                  </div>
                  {user?.plan && (
                    <Badge variant="secondary" className="ml-auto capitalize">
                      {user.plan}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                Upgrade to Pro
                <DropdownMenuShortcut className="tracking-tight">
                  Coming soon
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href="/" />}
                onClick={() => setOpenMobile(false)}
              >
                <User className="text-[#C39D03]" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href="/settings" />}
                onClick={() => setOpenMobile(false)}
              >
                <Settings className="dark:text-orange-400" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun className="dark:hidden" />
                  <Moon className="hidden dark:block" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={setTheme}
                  >
                    <DropdownMenuRadioItem value="light">
                      <Sun />
                      Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <Moon />
                      Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <Monitor />
                      System
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={busy} onClick={handleLogout}>
              <LogOut />
              {logout.isPending ? "Logging out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
