<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left"
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card"
  import { Separator } from "$lib/components/ui/separator"
  import { toast } from "svelte-sonner"

  let { data } = $props()

  let addingToCart = $state(false)

  function formatCurrency(amount: number | string) {
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num)
  }

  function getRarityVariant(rarity: string | null) {
    if (!rarity) return "outline"

    const r = rarity.toLowerCase()
    if (r.includes("common")) return "secondary"
    if (r.includes("uncommon")) return "default"
    if (r.includes("rare")) return "default"
    if (r.includes("mythic") || r.includes("legendary")) return "destructive"

    return "outline"
  }

  async function addToCart() {
    addingToCart = true
    try {
      // Try API first (for authenticated users)
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId: data.item.id, quantity: 1 }),
      })

      // If unauthorized (401), user is anonymous - use localStorage
      if (response.status === 401) {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]")
        const existingItem = cart.find(
          (item: { itemId: string; quantity: number }) => item.itemId === data.item.id,
        )

        if (existingItem) {
          existingItem.quantity += 1
        } else {
          cart.push({ itemId: data.item.id, quantity: 1 })
        }

        localStorage.setItem("cart", JSON.stringify(cart))
        toast.success("Added to cart")
      } else if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add to cart")
      } else {
        toast.success("Added to cart")
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Failed to add to cart")
      }
      console.error(error)
    } finally {
      addingToCart = false
    }
  }
</script>

<div class="container mx-auto space-y-8 px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-12">
  <!-- Back to Shop Button -->
  <div>
    <Button variant="ghost" href="/">
      <ArrowLeftIcon class="mr-2 h-4 w-4" />
      Back to Shop
    </Button>
  </div>

  <!-- Item Detail Section -->
  <div class="grid gap-8 lg:grid-cols-2">
    <!-- Image Section -->
    <div class="flex justify-center">
      {#if data.item.imageUrl}
        <img
          src={data.item.imageUrl}
          alt={data.item.name}
          class="h-auto max-h-[600px] w-full max-w-md rounded-lg object-contain shadow-lg"
        />
      {:else}
        <div class="flex h-[600px] w-full max-w-md items-center justify-center rounded-lg bg-muted">
          <p class="text-lg text-muted-foreground">No image available</p>
        </div>
      {/if}
    </div>

    <!-- Details Section -->
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold lg:text-4xl">{data.item.name}</h1>
        {#if data.item.setName}
          <p class="mt-2 text-lg text-muted-foreground">{data.item.setName}</p>
        {/if}
      </div>

      <div class="flex flex-wrap items-center gap-2">
        {#each data.categories ?? [] as category}
          <Badge variant="outline" class="text-sm">
            {category.title}
          </Badge>
        {/each}
        {#if data.item.rarity}
          <Badge variant={getRarityVariant(data.item.rarity)} class="text-sm">
            {data.item.rarity}
          </Badge>
        {/if}
      </div>

      <Separator />

      <div class="space-y-2">
        <div class="flex items-baseline justify-between">
          <p class="text-4xl font-bold">{formatCurrency(data.item.price)}</p>
          <p class="text-sm text-muted-foreground">
            {data.item.stockQty} in stock
          </p>
        </div>
      </div>

      {#if data.item.description}
        <div class="space-y-2">
          <h2 class="text-xl font-semibold">Description</h2>
          <p class="text-muted-foreground">{data.item.description}</p>
        </div>
      {/if}

      <Button
        class="w-full"
        size="lg"
        onclick={addToCart}
        disabled={addingToCart || data.item.stockQty === 0}
      >
        <ShoppingCartIcon class="mr-2 h-5 w-5" />
        {#if data.item.stockQty === 0}
          Out of Stock
        {:else if addingToCart}
          Adding...
        {:else}
          Add to Cart
        {/if}
      </Button>
    </div>
  </div>

  <!-- Related Items Section -->
  {#if data.relatedItems.length > 0}
    <div class="space-y-4">
      <Separator />
      <h2 class="text-2xl font-bold">Related Items</h2>
      <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {#each data.relatedItems as relatedItem (relatedItem.id)}
          <a href="/items/{relatedItem.id}" class="block transition-transform hover:scale-105">
            <Card class="overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader class="p-0">
                {#if relatedItem.imageUrl}
                  <img
                    src={relatedItem.imageUrl}
                    alt={relatedItem.name}
                    class="aspect-[3/4] w-full object-cover"
                  />
                {:else}
                  <div class="flex aspect-[3/4] w-full items-center justify-center bg-muted">
                    <p class="text-sm text-muted-foreground">No image</p>
                  </div>
                {/if}
              </CardHeader>
              <CardContent class="space-y-2 p-4">
                <CardTitle class="line-clamp-1 text-base">{relatedItem.name}</CardTitle>
                {#if relatedItem.setName}
                  <p class="line-clamp-1 text-xs text-muted-foreground">{relatedItem.setName}</p>
                {/if}
                <div class="flex items-baseline justify-between">
                  <p class="text-lg font-bold">{formatCurrency(relatedItem.price)}</p>
                  {#if relatedItem.rarity}
                    <Badge variant={getRarityVariant(relatedItem.rarity)} class="text-xs">
                      {relatedItem.rarity}
                    </Badge>
                  {/if}
                </div>
              </CardContent>
            </Card>
          </a>
        {/each}
      </div>
    </div>
  {/if}
</div>
