"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconChartBar,
  IconDashboard,
  IconMessage,
  IconSparkles,
} from "@tabler/icons-react"

import { useAuth } from '@/components/auth/AuthProvider'

import { NavUser } from '@/components/nav-user'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from '@/components/ui/sidebar'

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Analítica",
    url: "/dashboard/analytics",
    icon: IconChartBar,
  },
  {
    title: "Conversaciones",
    url: "/dashboard/conversations",
    icon: IconMessage,
  },
  {
    title: "Análisis IA",
    url: "/dashboard/analytics/ai",
    icon: IconSparkles,
  },
]

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user } = useAuth()
// Removed previous useEffect for onAuthStateChanged

  const navUser = user ? {
    name: user.displayName || "Usuario",
    email: user.email || "",
    avatar: user.photoURL || "",
  } : {
    name: "Cargando...",
    email: "",
    avatar: "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center justify-between h-14 px-2 border-b border-sidebar-border/50">
        <SidebarMenu className="group-data-[collapsible=icon]:hidden">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-transparent"
            >
              <Link href="/dashboard">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-[#c38692] flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>H</span>
                  </div>
                  <div className="flex flex-col gap-0 leading-none">
                    <span className="font-semibold text-sm" style={{ color: '#c38692' }}>Haminos AI</span>
                    <span className="text-[10px] text-muted-foreground">Chatbot Analytics</span>
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
