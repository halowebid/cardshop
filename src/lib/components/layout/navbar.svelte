<script lang="ts">
  import MenuIcon from "@lucide/svelte/icons/menu"
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart"
  import { browser } from "$app/environment"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { Separator } from "$lib/components/ui/separator"
  import { Sheet, SheetContent, SheetTrigger } from "$lib/components/ui/sheet"

  import NavUser from "./nav-user.svelte"

  type Props = {
    user: {
      name?: string
      email: string
      image?: string | null
    } | null
    cartCount?: number
  }

  let { user, cartCount = 0 }: Props = $props()

  let localCartCount = $state(0)
  let mobileMenuOpen = $state(false)

  // For anonymous users, read cart count from localStorage
  $effect(() => {
    if (browser && !user) {
      try {
        const cart = localStorage.getItem("cart")
        if (cart) {
          const items = JSON.parse(cart) as Array<{ quantity: number }>
          localCartCount = items.reduce((sum, item) => sum + item.quantity, 0)
        } else {
          localCartCount = 0
        }
      } catch {
        localCartCount = 0
      }
    }
  })

  const totalCartCount = $derived(user ? cartCount : localCartCount)

  const navLinks = [
    { href: "/", label: "Shop" },
    { href: "/orders", label: "Orders" },
  ]
</script>

<header
  class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
>
  <div
    class="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8 xl:px-12"
  >
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2 text-xl font-bold">
      <span>CardShop</span>
    </a>

    <!-- Desktop Navigation -->
    <nav class="hidden items-center gap-6 md:flex">
      {#each navLinks as link (link.href)}
        <a
          href={link.href}
          class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {link.label}
        </a>
      {/each}
    </nav>

    <!-- Right Side Actions -->
    <div class="flex items-center gap-2">
      <!-- Cart Button -->
      <Button variant="ghost" size="icon" href="/cart" class="relative">
        <ShoppingCartIcon class="h-5 w-5" />
        {#if totalCartCount > 0}
          <Badge
            variant="destructive"
            class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
          >
            {totalCartCount}
          </Badge>
        {/if}
        <span class="sr-only">Shopping cart</span>
      </Button>

      <!-- Desktop User Menu -->
      <div class="hidden md:block">
        <NavUser {user} />
      </div>

      <!-- Mobile Menu Trigger -->
      <Sheet bind:open={mobileMenuOpen}>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button {...props} variant="ghost" size="icon" class="md:hidden">
              <MenuIcon class="h-5 w-5" />
              <span class="sr-only">Toggle menu</span>
            </Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent side="right" class="w-80">
          <nav class="flex flex-col gap-4">
            <div class="mb-2 text-lg font-semibold">Menu</div>
            <Separator />
            {#each navLinks as link (link.href)}
              <a
                href={link.href}
                class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onclick={() => (mobileMenuOpen = false)}
              >
                {link.label}
              </a>
            {/each}
            <Separator />
            <div class="mt-2">
              <NavUser {user} />
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  </div>
</header>
