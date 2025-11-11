<script lang="ts">
  import { page } from "$app/stores"
  import AdminSidebar from "$lib/components/layout/admin-sidebar.svelte"
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "$lib/components/ui/breadcrumb"
  import { Separator } from "$lib/components/ui/separator"
  import { SidebarInset, SidebarProvider, SidebarTrigger } from "$lib/components/ui/sidebar"

  let { children, data } = $props()

  // Derive current page info for breadcrumb
  const currentPageLabel = $derived(() => {
    const pathname = $page.url.pathname
    if (pathname === "/admin") return "Dashboard"

    const navMap: Record<string, string> = {
      "/admin/categories": "Categories",
      "/admin/items": "Items",
      "/admin/inventory": "Inventory",
      "/admin/orders": "Orders",
    }

    return navMap[pathname] || "Dashboard"
  })
</script>

<SidebarProvider>
  <AdminSidebar user={data.user} />
  <SidebarInset>
    <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          {#if $page.url.pathname !== "/admin"}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPageLabel()}</BreadcrumbPage>
            </BreadcrumbItem>
          {/if}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {@render children()}
    </div>
  </SidebarInset>
</SidebarProvider>
