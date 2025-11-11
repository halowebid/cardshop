<script lang="ts">
  import { Separator } from "$lib/components/ui/separator"
  import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
  } from "$lib/components/ui/sidebar"

  let { children, data } = $props()

  const navItems = [
    { href: "/admin/categories", label: "Categories", icon: "🏷️" },
    { href: "/admin/items", label: "Items", icon: "🃏" },
    { href: "/admin/inventory", label: "Inventory", icon: "📦" },
    { href: "/admin/orders", label: "Orders", icon: "📋" },
  ]

  let currentPath = $state("")
  $effect(() => {
    currentPath = window.location.pathname
  })
</script>

<SidebarProvider>
  <Sidebar>
    <SidebarHeader>
      <div class="flex items-center gap-2 px-4 py-2">
        <span class="text-xl font-bold">CardShop Admin</span>
      </div>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Management</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {#each navItems as item}
              <SidebarMenuItem>
                <SidebarMenuButton isActive={currentPath === item.href}>
                  {#snippet child({ props })}
                    <a {...props} href={item.href}>
                      <span>{item.icon}</span>
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
      <div class="px-4 py-2 text-sm text-muted-foreground">
        Logged in as {data.user.name || data.user.email}
      </div>
    </SidebarFooter>
  </Sidebar>
  <SidebarInset>
    <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" class="mr-2 h-4" />
      <div class="flex flex-1 items-center justify-between">
        <h1 class="text-lg font-semibold">Admin Dashboard</h1>
        <a href="/" class="text-sm text-muted-foreground hover:text-foreground">View Store</a>
      </div>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4">
      {@render children()}
    </div>
  </SidebarInset>
</SidebarProvider>
