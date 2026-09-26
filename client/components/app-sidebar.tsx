"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CommandIcon, LayoutDashboardIcon, Settings2Icon } from "lucide-react"
import { useAuthStore } from "@/src/hooks/useAuth"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const navigation = [
  { title: "Dashboard", href: "/", icon: LayoutDashboardIcon },
  { title: "Settings", href: "/settings", icon: Settings2Icon },
]

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/" />}
              onClick={() => setOpenMobile(false)}
              className="h-11"
            >
              <CommandIcon className="size-5" />
              <span className="text-base font-semibold">Acme</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigation.map(({ title, href, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={pathname === href}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={() => setOpenMobile(false)}
                >
                  <Icon />
                  <span>{title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-3">
        {user && (
          <NavUser
            user={{ name: user.email.split("@")[0], email: user.email }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
