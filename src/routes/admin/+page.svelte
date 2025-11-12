<script lang="ts">
  import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle"
  import DollarSignIcon from "@lucide/svelte/icons/dollar-sign"
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid"
  import PackageIcon from "@lucide/svelte/icons/package"
  import PackageXIcon from "@lucide/svelte/icons/package-x"
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart"
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table"
  import { useDashboardStats } from "$lib/queries/dashboard"

  const dashboardQuery = useDashboardStats()

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
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
</script>

<div class="flex-1 space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
  </div>

  {#if dashboardQuery.isLoading}
    <div class="py-8 text-center text-muted-foreground">Loading dashboard data...</div>
  {:else if dashboardQuery.isError}
    <div class="py-8 text-center text-destructive">
      Error loading dashboard: {dashboardQuery.error?.message}
    </div>
  {:else if dashboardQuery.data}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSignIcon class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {formatCurrency(dashboardQuery.data.stats.totalRevenue)}
          </div>
          <p class="text-xs text-muted-foreground">
            From {dashboardQuery.data.stats.totalOrders} orders
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Pending Orders</CardTitle>
          <ShoppingCartIcon class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{dashboardQuery.data.stats.pendingOrders}</div>
          <p class="text-xs text-muted-foreground">
            <a href="/admin/orders" class="text-primary hover:underline">View all orders →</a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Items</CardTitle>
          <PackageIcon class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{dashboardQuery.data.stats.totalItems}</div>
          <p class="text-xs text-muted-foreground">
            In {dashboardQuery.data.stats.totalCategories} categories
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Stock Alerts</CardTitle>
          <AlertTriangleIcon class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-yellow-600">
            {dashboardQuery.data.stats.lowStockItems}
          </div>
          <p class="text-xs text-muted-foreground">
            <span class="text-destructive"
              >{dashboardQuery.data.stats.outOfStockItems} out of stock</span
            >
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card class="col-span-4">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest orders from customers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#if dashboardQuery.data.recentOrders.length === 0}
                <TableRow>
                  <TableCell colspan={4} class="text-center text-muted-foreground">
                    No orders yet
                  </TableCell>
                </TableRow>
              {:else}
                {#each dashboardQuery.data.recentOrders as order (order.id)}
                  <TableRow>
                    <TableCell class="font-medium">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{formatCurrency(parseFloat(order.totalPrice))}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                {/each}
              {/if}
            </TableBody>
          </Table>
          {#if dashboardQuery.data.recentOrders.length > 0}
            <div class="mt-4">
              <a href="/admin/orders">
                <Button variant="outline" class="w-full">View All Orders</Button>
              </a>
            </div>
          {/if}
        </CardContent>
      </Card>

      <Card class="col-span-3">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common management tasks</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-2">
          <a href="/admin/categories">
            <Button variant="outline" class="w-full justify-start">
              <LayoutGridIcon class="mr-2 h-4 w-4" />
              Manage Categories
            </Button>
          </a>
          <a href="/admin/items">
            <Button variant="outline" class="w-full justify-start">
              <PackageIcon class="mr-2 h-4 w-4" />
              Manage Items
            </Button>
          </a>
          <a href="/admin/inventory">
            <Button variant="outline" class="w-full justify-start">
              <AlertTriangleIcon class="mr-2 h-4 w-4" />
              Update Inventory
            </Button>
          </a>
          <a href="/admin/orders">
            <Button variant="outline" class="w-full justify-start">
              <ShoppingCartIcon class="mr-2 h-4 w-4" />
              View Orders
            </Button>
          </a>
        </CardContent>

        {#if dashboardQuery.data.stats.outOfStockItems > 0 || dashboardQuery.data.stats.lowStockItems > 0}
          <CardHeader class="pt-0">
            <CardTitle class="text-sm">Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            {#if dashboardQuery.data.stats.outOfStockItems > 0}
              <div class="flex items-center gap-2 text-sm">
                <PackageXIcon class="h-4 w-4 text-destructive" />
                <span class="font-medium text-destructive">
                  {dashboardQuery.data.stats.outOfStockItems} item{dashboardQuery.data.stats
                    .outOfStockItems !== 1
                    ? "s"
                    : ""} out of stock
                </span>
              </div>
            {/if}
            {#if dashboardQuery.data.stats.lowStockItems > 0}
              <div class="flex items-center gap-2 text-sm">
                <AlertTriangleIcon class="h-4 w-4 text-yellow-600" />
                <span class="font-medium text-yellow-600">
                  {dashboardQuery.data.stats.lowStockItems} item{dashboardQuery.data.stats
                    .lowStockItems !== 1
                    ? "s"
                    : ""} low on stock
                </span>
              </div>
            {/if}
          </CardContent>
        {/if}
      </Card>
    </div>
  {/if}
</div>
