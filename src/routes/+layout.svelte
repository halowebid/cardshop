<script lang="ts">
  import "../app.css"

  import { browser } from "$app/environment"
  import favicon from "$lib/assets/favicon.svg"
  import { Toaster } from "$lib/components/ui/sonner"
  import { onMount } from "svelte"
  import { toast } from "svelte-sonner"

  let { children } = $props()

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

{@render children()}

<Toaster richColors />
