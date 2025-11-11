<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left"
  import MinusIcon from "@lucide/svelte/icons/minus"
  import PlusIcon from "@lucide/svelte/icons/plus"
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart"
  import TrashIcon from "@lucide/svelte/icons/trash-2"
  import { goto } from "$app/navigation"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card"
  import { Input } from "$lib/components/ui/input"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table"
  import { onMount } from "svelte"
  import { toast } from "svelte-sonner"

  let { data } = $props()

  let updatingItem = $state<string | null>(null)
  let removingItem = $state<string | null>(null)
  let isAnonymous = $state(!data.isAuthenticated)

  // For anonymous users, load cart from localStorage on mount
  onMount(() => {
    if (isAnonymous) {
      loadAnonymousCart()
    }
  })

  async function loadAnonymousCart() {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    if (cart.length > 0) {
      // Reload page with cart data in query params
      const cartParam = encodeURIComponent(JSON.stringify(cart))
      goto(`/cart?cart=${cartParam}`, { replaceState: true })
    }
  }

  let cartTotal = $derived.by(() => {
    return data.cartItems.reduce((sum, cartItem) => {
      if (!cartItem.item) return sum
      const price = parseFloat(cartItem.item.price)
      return sum + price * cartItem.quantity
    }, 0)
  })

  function formatCurrency(amount: number | string) {
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num)
  }

  async function updateQuantity(cartItemId: string, newQuantity: number) {
    if (newQuantity < 1) return

    updatingItem = cartItemId
    try {
      if (isAnonymous) {
        // Update localStorage for anonymous users
        const cart = JSON.parse(localStorage.getItem("cart") || "[]")
        const item = cart.find((i: any) => i.itemId === cartItemId)
        if (item) {
          item.quantity = newQuantity
          localStorage.setItem("cart", JSON.stringify(cart))

          // Update local data
          const index = data.cartItems.findIndex((item) => item.itemId === cartItemId)
          if (index !== -1) {
            data.cartItems[index].quantity = newQuantity
          }

          toast.success("Quantity updated")
        }
      } else {
        // Update via API for authenticated users
        const response = await fetch(`/api/cart/${cartItemId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: newQuantity }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to update quantity")
        }

        // Update local data
        const index = data.cartItems.findIndex((item) => item.id === cartItemId)
        if (index !== -1) {
          data.cartItems[index].quantity = newQuantity
        }

        toast.success("Quantity updated")
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Failed to update quantity")
      }
      console.error(error)
    } finally {
      updatingItem = null
    }
  }

  async function removeItem(cartItemId: string) {
    removingItem = cartItemId
    try {
      if (isAnonymous) {
        // Remove from localStorage for anonymous users
        const cart = JSON.parse(localStorage.getItem("cart") || "[]")
        const filteredCart = cart.filter((i: any) => i.itemId !== cartItemId)
        localStorage.setItem("cart", JSON.stringify(filteredCart))

        // Remove from local data
        data.cartItems = data.cartItems.filter((item) => item.itemId !== cartItemId)

        toast.success("Item removed from cart")
      } else {
        // Remove via API for authenticated users
        const response = await fetch(`/api/cart/${cartItemId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to remove item")
        }

        // Remove from local data
        data.cartItems = data.cartItems.filter((item) => item.id !== cartItemId)

        toast.success("Item removed from cart")
      }
    } catch (error) {
      toast.error("Failed to remove item")
      console.error(error)
    } finally {
      removingItem = null
    }
  }
</script>

<div class="flex-1 space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <ShoppingCartIcon class="h-8 w-8" />
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Shopping Cart</h1>
        <p class="text-sm text-muted-foreground">Review and manage your cart items</p>
      </div>
    </div>
    <a href="/">
      <Button variant="outline">
        <ArrowLeftIcon class="mr-2 h-4 w-4" />
        Continue Shopping
      </Button>
    </a>
  </div>

  {#if data.cartItems.length === 0}
    <Card class="py-12">
      <CardContent class="space-y-4 text-center">
        <ShoppingCartIcon class="mx-auto h-16 w-16 text-muted-foreground" />
        <div>
          <p class="text-lg font-medium text-muted-foreground">Your cart is empty</p>
          <p class="text-sm text-muted-foreground">Add some items to get started</p>
        </div>
        <a href="/">
          <Button>Browse Items</Button>
        </a>
      </CardContent>
    </Card>
  {:else}
    <div class="grid gap-6 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>Cart Items</CardTitle>
          <CardDescription
            >{data.cartItems.length} item{data.cartItems.length !== 1 ? "s" : ""} in your cart</CardDescription
          >
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead class="text-right">Subtotal</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {#each data.cartItems as cartItem}
                  {#if cartItem.item}
                    <TableRow>
                      <TableCell>
                        <div class="flex items-center gap-3">
                          {#if cartItem.item.imageUrl}
                            <img
                              src={cartItem.item.imageUrl}
                              alt={cartItem.item.name}
                              class="h-16 w-12 rounded object-cover"
                            />
                          {:else}
                            <div
                              class="flex h-16 w-12 items-center justify-center rounded bg-muted"
                            >
                              <p class="text-xs text-muted-foreground">No img</p>
                            </div>
                          {/if}
                          <div>
                            <p class="font-medium">{cartItem.item.name}</p>
                            {#if cartItem.item.setName}
                              <p class="text-xs text-muted-foreground">
                                {cartItem.item.setName}
                              </p>
                            {/if}
                            {#if cartItem.item.rarity}
                              <Badge variant="outline" class="mt-1 text-xs">
                                {cartItem.item.rarity}
                              </Badge>
                            {/if}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(cartItem.item.price)}</TableCell>
                      <TableCell>
                        <div class="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            class="h-8 w-8"
                            onclick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                            disabled={updatingItem === cartItem.id || cartItem.quantity <= 1}
                          >
                            <MinusIcon class="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max={cartItem.item.stockQty}
                            value={cartItem.quantity}
                            onchange={(e) => {
                              const value = parseInt(e.currentTarget.value)
                              if (value > 0 && value <= cartItem.item!.stockQty) {
                                updateQuantity(cartItem.id, value)
                              }
                            }}
                            disabled={updatingItem === cartItem.id}
                            class="w-16 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            class="h-8 w-8"
                            onclick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                            disabled={updatingItem === cartItem.id ||
                              cartItem.quantity >= cartItem.item.stockQty}
                          >
                            <PlusIcon class="h-3 w-3" />
                          </Button>
                        </div>
                        <p class="mt-1 text-xs text-muted-foreground">
                          {cartItem.item.stockQty} available
                        </p>
                      </TableCell>
                      <TableCell class="text-right font-medium">
                        {formatCurrency(parseFloat(cartItem.item.price) * cartItem.quantity)}
                      </TableCell>
                      <TableCell class="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-destructive hover:text-destructive"
                          onclick={() => removeItem(cartItem.id)}
                          disabled={removingItem === cartItem.id}
                        >
                          <TrashIcon class="h-4 w-4" />
                          <span class="sr-only">Remove item</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  {/if}
                {/each}
              </TableBody>
            </Table>
          </div></CardContent
        >
      </Card>

      <Card class="sticky top-6 h-fit">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Subtotal</span>
            <span class="font-medium">{formatCurrency(cartTotal)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Shipping</span>
            <span class="font-medium">Free</span>
          </div>
          <div class="border-t pt-4">
            <div class="flex justify-between">
              <span class="text-lg font-semibold">Total</span>
              <span class="text-lg font-bold">{formatCurrency(cartTotal)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          {#if isAnonymous}
            <a href="/auth/sign-in?redirect=/checkout" class="w-full">
              <Button class="w-full" disabled={data.cartItems.length === 0}>
                Sign In to Checkout
              </Button>
            </a>
          {:else}
            <a href="/checkout" class="w-full">
              <Button class="w-full" disabled={data.cartItems.length === 0}>
                Proceed to Checkout
              </Button>
            </a>
          {/if}
        </CardFooter>
      </Card>
    </div>
  {/if}
</div>
