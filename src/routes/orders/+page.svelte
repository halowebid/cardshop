<script lang="ts">
  import EyeIcon from "@lucide/svelte/icons/eye"
  import PackageIcon from "@lucide/svelte/icons/package"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card"
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table"

  let { data } = $props()

  let selectedOrder = $state<(typeof data.orders)[number] | null>(null)
  let dialogOpen = $state(false)

  function formatCurrency(amount: number | string) {
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num)
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  function getStatusVariant(status: string) {
    switch (status) {
      case "pending":
        return "secondary"
      case "completed":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  function getOrderTotalItems(order: (typeof data.orders)[number]) {
    return order.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  function viewOrderDetails(order: (typeof data.orders)[number]) {
    selectedOrder = order
    dialogOpen = true
  }
</script>

<div class="container mx-auto space-y-6 px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-12">
  {#if data.orders.length === 0}
    <Card class="py-12">
      <CardContent class="space-y-4 text-center">
        <PackageIcon class="mx-auto h-16 w-16 text-muted-foreground" />
        <div>
          <p class="text-lg font-medium text-muted-foreground">No orders yet</p>
          <p class="text-sm text-muted-foreground">Start shopping to see your orders here</p>
        </div>
        <a href="/">
          <Button>Browse Items</Button>
        </a>
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
        <CardDescription>
          {data.orders.length} order{data.orders.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each data.orders as order (order.id)}
              <TableRow>
                <TableCell class="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  {getOrderTotalItems(order)} item{getOrderTotalItems(order) !== 1 ? "s" : ""}
                </TableCell>
                <TableCell class="font-medium">{formatCurrency(order.totalPrice)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => viewOrderDetails(order)}
                    class="h-8 w-8 p-0"
                  >
                    <EyeIcon class="h-4 w-4" />
                    <span class="sr-only">View details</span>
                  </Button>
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  {/if}
</div>

<Dialog bind:open={dialogOpen}>
  <DialogContent class="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Order Details</DialogTitle>
      <DialogDescription>View order items and status</DialogDescription>
    </DialogHeader>

    {#if selectedOrder}
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Order ID</p>
            <p class="font-mono text-sm">{selectedOrder.id}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-muted-foreground">Date</p>
            <p class="text-sm">{formatDate(selectedOrder.createdAt)}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-muted-foreground">Total Amount</p>
            <p class="text-lg font-bold">{formatCurrency(selectedOrder.totalPrice)}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-muted-foreground">Status</p>
            <Badge variant={getStatusVariant(selectedOrder.status)}>
              {selectedOrder.status}
            </Badge>
          </div>
        </div>

        <div>
          <h4 class="mb-2 text-sm font-medium">Order Items</h4>
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead class="text-right">Price</TableHead>
                  <TableHead class="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {#each selectedOrder.items as item (item.itemId)}
                  <TableRow>
                    <TableCell>
                      <div class="flex flex-col">
                        <span class="font-medium">{item.itemName || "Unknown Item"}</span>
                        <span class="font-mono text-xs text-muted-foreground">
                          {item.itemId.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell class="text-right">{formatCurrency(item.priceAtTime)}</TableCell>
                    <TableCell class="text-right font-medium">
                      {formatCurrency(parseFloat(item.priceAtTime) * item.quantity)}
                    </TableCell>
                  </TableRow>
                {/each}
                <TableRow>
                  <TableCell colspan={3} class="font-medium">Total</TableCell>
                  <TableCell class="text-right font-bold">
                    {formatCurrency(selectedOrder.totalPrice)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" onclick={() => (dialogOpen = false)}>Close</Button>
        </div>
      </div>
    {/if}
  </DialogContent>
</Dialog>
