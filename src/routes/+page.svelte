<script lang="ts">
  import FilterIcon from "@lucide/svelte/icons/filter"
  import SearchIcon from "@lucide/svelte/icons/search"
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import {
    SelectContent,
    SelectItem,
    Select as SelectRoot,
    SelectTrigger,
  } from "$lib/components/ui/select"
  import { Skeleton } from "$lib/components/ui/skeleton"
  import { useCategories } from "$lib/queries/categories"
  import { useItems } from "$lib/queries/items"
  import { toast } from "svelte-sonner"

  const categoriesQuery = useCategories()
  const itemsQuery = useItems()

  let searchQuery = $state("")
  let selectedCategory = $state<string>("all")
  let addingToCart = $state<string | null>(null)

  let filteredItems = $derived.by(() => {
    if (!itemsQuery.data) return []

    let items = itemsQuery.data.filter((item) => item.stockQty > 0)

    if (selectedCategory !== "all") {
      items = items.filter((item) => item.categoryIds.includes(selectedCategory))
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.setName?.toLowerCase().includes(query) ||
          item.rarity?.toLowerCase().includes(query),
      )
    }

    return items
  })

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

  function getCategoryName(categoryId: string) {
    if (!categoriesQuery.data) return "Unknown"
    const cat = categoriesQuery.data.find((c) => c.id === categoryId)
    return cat?.title || "Unknown"
  }

  async function addToCart(itemId: string, event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    addingToCart = itemId
    try {
      // Try API first (for authenticated users)
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, quantity: 1 }),
      })

      // If unauthorized (401), user is anonymous - use localStorage
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
      addingToCart = null
    }
  }
</script>

<div class="container mx-auto space-y-6 px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-12">
  {#if categoriesQuery.isLoading || itemsQuery.isLoading}
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Skeleton class="h-10 w-64" />
      <Skeleton class="h-10 w-48" />
    </div>
  {:else if categoriesQuery.error || itemsQuery.error}
    <Card class="py-12">
      <CardContent class="text-center">
        <p class="text-lg font-medium text-destructive">Error loading page</p>
        <p class="text-sm text-muted-foreground">
          {categoriesQuery.error?.message || itemsQuery.error?.message}
        </p>
      </CardContent>
    </Card>
  {:else if categoriesQuery.data && itemsQuery.data}
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 items-center gap-2">
        <div class="relative max-w-sm flex-1">
          <SearchIcon class="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search cards..."
            class="pl-8"
            bind:value={searchQuery}
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <FilterIcon class="h-4 w-4 text-muted-foreground" />
        <Label for="category-filter" class="text-sm font-medium">Category:</Label>
        <SelectRoot type="single" bind:value={selectedCategory}>
          <SelectTrigger id="category-filter" class="w-[180px]">
            {#if selectedCategory === "all"}
              All Categories
            {:else}
              {getCategoryName(selectedCategory)}
            {/if}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {#each categoriesQuery.data as category (category.id)}
              <SelectItem value={category.id}>{category.title}</SelectItem>
            {/each}
          </SelectContent>
        </SelectRoot>
      </div>
    </div>

    {#if filteredItems.length === 0}
      <Card class="py-12">
        <CardContent class="text-center">
          <p class="text-lg font-medium text-muted-foreground">No items found</p>
          <p class="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
        </CardContent>
      </Card>
    {:else}
      <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {#each filteredItems as item (item.id)}
          <a href="/items/{item.slug}" class="block transition-transform hover:scale-105">
            <Card class="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader class="p-0">
                {#if item.imageUrl}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    class="aspect-[3/4] w-full object-cover"
                  />
                {:else}
                  <div class="flex aspect-[3/4] w-full items-center justify-center bg-muted">
                    <p class="text-sm text-muted-foreground">No image</p>
                  </div>
                {/if}
              </CardHeader>
              <CardContent class="flex-1 space-y-2 p-4">
                <div class="space-y-1">
                  <CardTitle class="line-clamp-1 text-base">{item.name}</CardTitle>
                  {#if item.setName}
                    <p class="line-clamp-1 text-xs text-muted-foreground">{item.setName}</p>
                  {/if}
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  {#each item.categories ?? [] as category (category.id)}
                    <a
                      href="/categories/{category.slug}"
                      class="transition-opacity hover:opacity-70"
                      onclick={(e) => e.stopPropagation()}
                    >
                      <Badge variant="outline" class="text-xs">
                        {category.title}
                      </Badge>
                    </a>
                  {/each}
                  {#if item.rarity}
                    <Badge variant={getRarityVariant(item.rarity)} class="text-xs">
                      {item.rarity}
                    </Badge>
                  {/if}
                </div>
                <div class="flex items-baseline justify-between">
                  <p class="text-2xl font-bold">{formatCurrency(item.price)}</p>
                  <p class="text-xs text-muted-foreground">{item.stockQty} in stock</p>
                </div>
              </CardContent>
              <CardFooter class="p-4 pt-0">
                <Button
                  class="w-full"
                  onclick={(e) => addToCart(item.id, e)}
                  disabled={addingToCart === item.id || item.stockQty === 0}
                >
                  <ShoppingCartIcon class="mr-2 h-4 w-4" />
                  {#if item.stockQty === 0}
                    Out of Stock
                  {:else if addingToCart === item.id}
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
    {/if}

    <div class="pb-4 text-center text-sm text-muted-foreground">
      Showing {filteredItems.length} of {itemsQuery.data.filter((item) => item.stockQty > 0).length}
      item{itemsQuery.data.filter((item) => item.stockQty > 0).length !== 1 ? "s" : ""}
    </div>
  {/if}
</div>
