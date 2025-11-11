<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left"
  import CheckCircleIcon from "@lucide/svelte/icons/check-circle"
  import CreditCardIcon from "@lucide/svelte/icons/credit-card"
  import { goto } from "$app/navigation"
  import { Button } from "$lib/components/ui/button"
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table"
  import { toast } from "svelte-sonner"

  let { data } = $props()

  let placingOrder = $state(false)

  let orderTotal = $derived.by(() => {
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

  async function placeOrder() {
    placingOrder = true
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to place order")
      }

      const order = await response.json()

      toast.success("Order placed successfully!", {
        description: `Order ID: ${order.id.slice(0, 8)}...`,
      })

      // Redirect to orders page
      setTimeout(() => {
        goto("/orders")
      }, 1000)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Failed to place order")
      }
      console.error(error)
      placingOrder = false
    }
  }
</script>

<div class="mx-auto max-w-5xl flex-1 space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <CreditCardIcon class="h-8 w-8" />
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Checkout</h1>
        <p class="text-sm text-muted-foreground">Review your order and confirm purchase</p>
      </div>
    </div>
    <a href="/cart">
      <Button variant="outline">
        <ArrowLeftIcon class="mr-2 h-4 w-4" />
        Back to Cart
      </Button>
    </a>
  </div>

  <div class="grid gap-6 lg:grid-cols-3">
    <div class="space-y-6 lg:col-span-2">
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead class="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each data.cartItems as cartItem}
                {#if cartItem.item}
                  <TableRow>
                    <TableCell>
                      <p class="font-medium">{cartItem.item.name}</p>
                    </TableCell>
                    <TableCell>{formatCurrency(cartItem.item.price)}</TableCell>
                    <TableCell>{cartItem.quantity}</TableCell>
                    <TableCell class="text-right font-medium">
                      {formatCurrency(parseFloat(cartItem.item.price) * cartItem.quantity)}
                    </TableCell>
                  </TableRow>
                {/if}
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-muted-foreground">Name:</p>
            <p class="text-sm">{data.user.name}</p>
          </div>
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-muted-foreground">Email:</p>
            <p class="text-sm">{data.user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
            <CreditCardIcon class="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">
              Payment processing is simulated for this demo
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Click "Place Order" to complete your purchase
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card class="sticky top-6 h-fit">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          {#each data.cartItems as cartItem}
            {#if cartItem.item}
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">
                  {cartItem.item.name} × {cartItem.quantity}
                </span>
                <span>{formatCurrency(parseFloat(cartItem.item.price) * cartItem.quantity)}</span>
              </div>
            {/if}
          {/each}
        </div>

        <div class="space-y-2 border-t pt-4">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Subtotal</span>
            <span class="font-medium">{formatCurrency(orderTotal)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Shipping</span>
            <span class="font-medium">Free</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Tax</span>
            <span class="font-medium">$0.00</span>
          </div>
        </div>

        <div class="border-t pt-4">
          <div class="flex justify-between">
            <span class="text-lg font-semibold">Total</span>
            <span class="text-lg font-bold">{formatCurrency(orderTotal)}</span>
          </div>
        </div>

        <Button class="w-full" size="lg" onclick={placeOrder} disabled={placingOrder}>
          <CheckCircleIcon class="mr-2 h-5 w-5" />
          {placingOrder ? "Placing Order..." : "Place Order"}
        </Button>

        <p class="text-center text-xs text-muted-foreground">
          By placing this order, you agree to our terms and conditions
        </p>
      </CardContent>
    </Card>
  </div>
</div>
