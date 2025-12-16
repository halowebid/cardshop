<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left"
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle"
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card"
  import { Empty, EmptyDescription, EmptyTitle } from "$lib/components/ui/empty"
  import { Skeleton } from "$lib/components/ui/skeleton"
  import { useItemsInfinite } from "$lib/queries/items"
  import Seo from "sk-seo"
  import { toast } from "svelte-sonner"

  let { data } = $props()

  let addingToCartId = $state<string | null>(null)
  let sentinelElement = $state<HTMLElement | null>(null)

  const itemsQuery = useItemsInfinite(() => ({ category_id: data.category.id }))

  const allItems = $derived.by(() => {
    if (!itemsQuery.data?.pages) return []
    return itemsQuery.data.pages.flatMap((page) => page.data).filter((item) => item.stockQty > 0)
  })

  const totalItems = $derived(itemsQuery.data?.pages?.[0]?.meta.total ?? 0)

  $effect(() => {
    if (!sentinelElement || !itemsQuery.hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && itemsQuery.hasNextPage && !itemsQuery.isFetchingNextPage) {
            itemsQuery.fetchNextPage()
          }
        })
      },
      {
        rootMargin: "200px",
      },
    )

    observer.observe(sentinelElement)

    return () => {
      observer.disconnect()
    }
  })

  function formatCurrency(amount: number | string) {
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num)
  }

  async function addToCart(itemId: string, event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    addingToCartId = itemId
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, quantity: 1 }),
      })

      if (response.status === 401) {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]")
        const existingItem = cart.find(
          (item: { itemId: string; quantity: number }) => item.itemId === itemId,
        )

        if (existingItem) {
          existingItem.quantity += 1
        } else {
          cart.push({ itemId, quantity: 1 })
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
      addingToCartId = null
    }
  }
</script>

<Seo
  title={data.category.metaTitle ?? `${data.category.title} - CardShop`}
  description={data.category.metaDescription ??
    `Browse ${data.category.title} trading cards. ${data.category.description ? data.category.description.replace(/<[^>]*>/g, "").slice(0, 150) : "Find the perfect cards for your collection."}`}
/>

<div class="container mx-auto space-y-8 px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-12">
  <div>
    <Button variant="ghost" href="/">
      <ArrowLeftIcon class="mr-2 h-4 w-4" />
      Back to Shop
    </Button>
  </div>

  <div class="space-y-4">
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
      {#if data.category.imageUrl}
        <img
          src={data.category.imageUrl}
          alt={data.category.title}
          class="h-32 w-32 rounded-lg object-cover shadow-md md:h-40 md:w-40"
        />
      {/if}
      <div class="flex-1 space-y-2">
        <h1 class="text-3xl font-bold lg:text-4xl">{data.category.title}</h1>
        {#if data.category.description}
          <p class="text-lg text-muted-foreground">{data.category.description}</p>
        {/if}
        {#if itemsQuery.isLoading}
          <Skeleton class="h-5 w-24" />
        {:else}
          <p class="text-sm text-muted-foreground">
            {totalItems}
            {totalItems === 1 ? "item" : "items"} available
          </p>
        {/if}
      </div>
    </div>
  </div>

  {#if itemsQuery.isLoading}
    <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {#each Array(8) as _, index (index)}
        <Skeleton class="h-96" />
      {/each}
    </div>
  {:else if itemsQuery.error}
    <Card class="py-12">
      <CardContent class="text-center">
        <p class="text-lg font-medium text-destructive">Error loading items</p>
        <p class="text-sm text-muted-foreground">{itemsQuery.error.message}</p>
      </CardContent>
    </Card>
  {:else if allItems.length > 0}
    <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {#each allItems as item (item.id)}
        <a href="/items/{item.slug}" class="block transition-transform hover:scale-105">
          <Card class="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
            <CardHeader class="p-0">
              {#if item.imageUrl}
                <img src={item.imageUrl} alt={item.name} class="aspect-[3/4] w-full object-cover" />
              {:else}
                <div class="flex aspect-[3/4] w-full items-center justify-center bg-muted">
                  <p class="text-sm text-muted-foreground">No image</p>
                </div>
              {/if}
            </CardHeader>
            <CardContent class="flex-1 space-y-2 p-4">
              <CardTitle class="line-clamp-2 text-base">{item.name}</CardTitle>
              {#if item.setName}
                <p class="line-clamp-1 text-xs text-muted-foreground">{item.setName}</p>
              {/if}
              <div class="flex items-baseline justify-between">
                <p class="text-lg font-bold">{formatCurrency(item.price)}</p>
                {#if item.rarity}
                  <Badge
                    variant="outline"
                    class="border text-xs font-semibold"
                    style="border-color: {item.rarity.color}; color: {item.rarity.color};"
                  >
                    {item.rarity.name}
                  </Badge>
                {/if}
              </div>
              <p class="text-xs text-muted-foreground">{item.stockQty} in stock</p>
              {#if item.stockQty > 0 && item.stockQty < 10}
                <Badge variant="destructive" class="w-fit text-xs">
                  Only {item.stockQty} left
                </Badge>
              {/if}
            </CardContent>
            <CardFooter class="p-4 pt-0">
              <Button
                class="w-full"
                size="sm"
                onclick={(e) => addToCart(item.id, e)}
                disabled={addingToCartId === item.id || item.stockQty === 0}
              >
                <ShoppingCartIcon class="mr-2 h-4 w-4" />
                {#if item.stockQty === 0}
                  Out of Stock
                {:else if addingToCartId === item.id}
                  Adding...
                {:else}
                  Add to Cart
                {/if}
              </Button>
            </CardFooter>
          </Card>
        </a>
      {/each}
    </div>

    <!-- Infinite scroll sentinel -->
    <div bind:this={sentinelElement} class="flex justify-center py-8">
      {#if itemsQuery.isFetchingNextPage}
        <LoaderCircleIcon class="h-8 w-8 animate-spin text-muted-foreground" />
      {/if}
    </div>
  {:else}
    <Empty>
      <EmptyTitle>No items available</EmptyTitle>
      <EmptyDescription>
        There are currently no items in this category. Check back later!
      </EmptyDescription>
      <Button href="/">Browse All Items</Button>
    </Empty>
  {/if}
</div>
