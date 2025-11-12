<script lang="ts">
  import EyeIcon from "@lucide/svelte/icons/eye"
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
    SelectContent,
    SelectItem,
    Select as SelectRoot,
    SelectTrigger,
  } from "$lib/components/ui/select"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table"
  import { useOrders, useUpdateOrderStatus, type Order } from "$lib/queries/orders"

  // Queries - fetch on client only with 60s refetch interval for new orders
  const ordersQuery = useOrders()

  // Mutations
  const updateStatusMutation = useUpdateOrderStatus()

  let selectedOrder = $state<Order | null>(null)
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

  function viewOrderDetails(order: Order) {
    selectedOrder = order
    dialogOpen = true
  }

  function updateOrderStatus(orderId: string, newStatus: string) {
    updateStatusMutation.mutate(
      { id: orderId, status: newStatus },
      {
        onSuccess: (updatedOrder) => {
          // Update selected order if it's the one being viewed
          if (selectedOrder?.id === orderId) {
            selectedOrder = updatedOrder
          }
        },
      },
    )
  }

  function getOrderTotalItems(order: Order) {
    return order.items.reduce((sum, item) => sum + item.quantity, 0)
  }
</script>

<div class="flex-1 space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Orders</h2>
      <p class="text-sm text-muted-foreground">Manage customer orders and update status</p>
    </div>
  </div>

  {#if ordersQuery.isLoading}
    <Card>
      <CardContent class="flex items-center justify-center p-8">
        <p class="text-muted-foreground">Loading orders...</p>
      </CardContent>
    </Card>
  {:else if ordersQuery.isError}
    <Card>
      <CardContent class="flex items-center justify-center p-8">
        <p class="text-destructive">Error loading orders: {ordersQuery.error.message}</p>
      </CardContent>
    </Card>
  {:else if ordersQuery.data}
    <Card>
      <CardHeader>
        <CardTitle>All Orders</CardTitle>
        <CardDescription>
          {ordersQuery.data.length} total order{ordersQuery.data.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#if ordersQuery.data.length === 0}
              <TableRow>
                <TableCell colspan={7} class="text-center text-muted-foreground">
                  No orders yet
                </TableCell>
              </TableRow>
            {:else}
              {#each ordersQuery.data as order (order.id)}
                <TableRow>
                  <TableCell class="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <div class="flex flex-col">
                      <span class="font-medium">{order.userName || "Unknown"}</span>
                      <span class="text-xs text-muted-foreground">{order.userEmail || "N/A"}</span>
                    </div>
                  </TableCell>
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
            {/if}
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
      <DialogDescription>View order items and update order status</DialogDescription>
    </DialogHeader>

    {#if selectedOrder}
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Order ID</p>
            <p class="font-mono text-sm">{selectedOrder.id}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-muted-foreground">Customer</p>
            <p class="text-sm font-medium">{selectedOrder.userName || "Unknown"}</p>
            <p class="text-xs text-muted-foreground">{selectedOrder.userEmail || "N/A"}</p>
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
            <div class="flex items-center gap-2">
              <SelectRoot
                type="single"
                value={selectedOrder.status}
                onValueChange={(value: string | undefined) => {
                  if (value && selectedOrder) {
                    updateOrderStatus(selectedOrder.id, value)
                  }
                }}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger class="w-[140px]">
                  <Badge variant={getStatusVariant(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </SelectRoot>
            </div>
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
      </div>
    {/if}
  </DialogContent>
</Dialog>
