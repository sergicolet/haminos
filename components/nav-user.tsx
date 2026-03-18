"use client"

import {
  IconDotsVertical,
  IconLogout,
  IconBadgeCheck,
  IconBell,
  IconCreditCard,
  IconSparkles,
} from "@tabler/icons-react"
import { useAuth } from "@/components/auth/AuthProvider"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function NavUser({
  user: initialUser,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { user, logout } = useAuth()

  const displayName = user?.displayName || initialUser.name
  const displayEmail = user?.email || initialUser.email
  const displayAvatar = user?.photoURL || initialUser.avatar

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {displayAvatar ? <AvatarImage src={displayAvatar} alt={displayName || "Usuario"} /> : null}
                <AvatarFallback className="rounded-lg">{displayName ? displayName.substring(0, 2).toUpperCase() : "US"}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">
                  {displayEmail}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-popover"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* App label */}
            <div className="px-2 py-1.5">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#c38692' }}>
                Haminos AI
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {displayAvatar ? <AvatarImage src={displayAvatar} alt={displayName || "Usuario"} /> : null}
                  <AvatarFallback className="rounded-lg">{displayName ? displayName.substring(0, 2).toUpperCase() : "US"}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">
                    {displayEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-500 focus:text-red-500">
              <IconLogout className="mr-2 size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
