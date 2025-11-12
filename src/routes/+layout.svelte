<script lang="ts">
  import "../app.css"

  import { QueryClientProvider } from "@tanstack/svelte-query"
  import { browser, dev } from "$app/environment"
  import { page } from "$app/stores"
  import favicon from "$lib/assets/favicon.svg"
  import Footer from "$lib/components/layout/footer.svelte"
  import Navbar from "$lib/components/layout/navbar.svelte"
  import { Toaster } from "$lib/components/ui/sonner"
  import { createQueryClient } from "$lib/query-client"
  import { onMount } from "svelte"
  import { toast } from "svelte-sonner"

  let { children, data } = $props()

  // Create query client once per app instance
  const queryClient = createQueryClient()

  // Determine if current route is admin
  const isAdminRoute = $derived($page.url.pathname.startsWith("/admin"))

  // Dynamically import devtools only on client in dev mode
  let DevtoolsComponent = $state<any>(null)
  onMount(async () => {
    if (dev) {
      const { SvelteQueryDevtools } = await import("@tanstack/svelte-query-devtools")
      DevtoolsComponent = SvelteQueryDevtools
    }

    // Handle cart migration after login
    const pendingCart = sessionStorage.getItem("pendingCartMigration")
    if (pendingCart) {
      try {
        const cart = JSON.parse(pendingCart)
        const response = await fetch("/api/cart/migrate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: cart }),
        })

        if (response.ok) {
          // Clear localStorage and sessionStorage cart
          localStorage.removeItem("cart")
          sessionStorage.removeItem("pendingCartMigration")
          toast.success("Cart synced successfully")
        }
      } catch (error) {
        console.error("Failed to migrate cart:", error)
      }
    }
  })
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
  {#if isAdminRoute}
    <!-- Admin routes have their own layout -->
    {@render children()}
  {:else}
    <!-- Public routes get navbar and footer -->
    <div class="flex min-h-screen flex-col">
      <Navbar user={data.user} cartCount={data.cartCount} />
      <main class="flex-1">
        {@render children()}
      </main>
      <Footer />
    </div>
  {/if}

  {#if DevtoolsComponent}
    <DevtoolsComponent initialIsOpen={false} position="bottom" buttonPosition="bottom-right" />
  {/if}
</QueryClientProvider>

<Toaster richColors />
