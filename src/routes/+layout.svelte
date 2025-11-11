<script lang="ts">
  import "../app.css"

  import { browser } from "$app/environment"
  import { page } from "$app/stores"
  import favicon from "$lib/assets/favicon.svg"
  import Footer from "$lib/components/layout/footer.svelte"
  import Navbar from "$lib/components/layout/navbar.svelte"
  import { Toaster } from "$lib/components/ui/sonner"
  import { onMount } from "svelte"
  import { toast } from "svelte-sonner"

  let { children, data } = $props()

  // Determine if current route is admin
  const isAdminRoute = $derived($page.url.pathname.startsWith("/admin"))

  // Handle cart migration after login
  onMount(async () => {
    if (!browser) return

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

<Toaster richColors />
