<script lang="ts">
  import BoxIcon from "@lucide/svelte/icons/box"
  import ChevronUpIcon from "@lucide/svelte/icons/chevron-up"
  import ClipboardListIcon from "@lucide/svelte/icons/clipboard-list"
  import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard"
  import LogOutIcon from "@lucide/svelte/icons/log-out"
  import PackageIcon from "@lucide/svelte/icons/package"
  import StoreIcon from "@lucide/svelte/icons/store"
  import TagIcon from "@lucide/svelte/icons/tag"
  import { page } from "$app/stores"
  import { Avatar, AvatarFallback } from "$lib/components/ui/avatar"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "$lib/components/ui/dropdown-menu"
  import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
  } from "$lib/components/ui/sidebar"
  import type { Component } from "svelte"

  type Props = {
    user: {
      name?: string
      email: string
    }
  }

  let { user }: Props = $props()

  const navItems: Array<{
    href: string
    label: string
    icon: Component
  }> = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      href: "/admin/categories",
      label: "Categories",
      icon: TagIcon,
    },
    {
      href: "/admin/items",
      label: "Items",
      icon: PackageIcon,
    },
    {
      href: "/admin/inventory",
      label: "Inventory",
      icon: BoxIcon,
    },
    {
      href: "/admin/orders",
      label: "Orders",
      icon: ClipboardListIcon,
    },
  ]

  const currentPath = $derived($page.url.pathname)

  const userInitials = $derived.by(() => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email[0].toUpperCase()
  })
</script>

<Sidebar>
  <SidebarHeader>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          {#snippet child({ props })}
            <a {...props} href="/admin" class="flex items-center gap-2">
              <div
                class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              >
                <StoreIcon class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">CardShop</span>
                <span class="truncate text-xs">Admin Panel</span>
              </div>
            </a>
          {/snippet}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Management</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {#each navItems as item (item.href)}
            <SidebarMenuItem>
              <SidebarMenuButton size="default" isActive={currentPath === item.href}>
                {#snippet child({ props })}
                  <a {...props} href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                {/snippet}
              </SidebarMenuButton>
            </SidebarMenuItem>
          {/each}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
  <SidebarFooter>
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            class="flex w-full items-center gap-2 rounded-lg p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Avatar class="size-8 rounded-lg">
              <AvatarFallback class="rounded-lg">{userInitials}</AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{user.name || "Admin"}</span>
              <span class="truncate text-xs">{user.email}</span>
            </div>
            <ChevronUpIcon class="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-[--radix-dropdown-menu-trigger-width] min-w-56" side="top">
            <DropdownMenuItem>
              <a href="/" class="flex w-full items-center gap-2">
                <StoreIcon class="size-4" />
                <span>View Store</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <form action="/auth/sign-out" method="POST" class="w-full">
                <button type="submit" class="flex w-full items-center gap-2 text-left">
                  <LogOutIcon class="size-4" />
                  <span>Sign out</span>
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarFooter>
</Sidebar>
