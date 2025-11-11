<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import { Button } from "$lib/components/ui/button"
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
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

  interface InventoryItem {
    id: number
    name: string
    stockQty: number
    category?: { title: string } | null
    setName?: string | null
  }

  let dialogOpen = $state(false)
  let selectedItem = $state<InventoryItem | null>(null)
  let stockUpdate = $state({
    stockQty: "0",
    operation: "set" as "set" | "add" | "subtract",
  })

  function openStockDialog(item: InventoryItem) {
    selectedItem = item
    stockUpdate = {
      stockQty: item.stockQty.toString(),
      operation: "set",
    }
    dialogOpen = true
  }

  async function handleStockUpdate() {
    if (!selectedItem) return

    try {
      const newStock =
        stockUpdate.operation === "set"
          ? parseInt(stockUpdate.stockQty)
          : stockUpdate.operation === "add"
            ? selectedItem.stockQty + parseInt(stockUpdate.stockQty)
            : selectedItem.stockQty - parseInt(stockUpdate.stockQty)

      if (newStock < 0) {
        toast.error("Stock quantity cannot be negative")
        return
      }

      const response = await fetch(`/api/items/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockQty: newStock,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to update stock")
        return
      }

      toast.success("Stock updated successfully")
      dialogOpen = false
      selectedItem = null
      await invalidateAll()
    } catch {
      toast.error("Failed to update stock")
    }
  }

  function getStockStatus(qty: number) {
    if (qty === 0) return "text-destructive"
    if (qty < 10) return "text-yellow-600"
    return "text-green-600"
  }
</script>

<div>
  <h2 class="text-2xl font-bold">Inventory Management</h2>
  <p class="mt-1 text-muted-foreground">Manage stock quantities for all items</p>
</div>

<div class="mt-4 rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Item Name</TableHead>
        <TableHead>Category</TableHead>
        <TableHead>Set</TableHead>
        <TableHead>Current Stock</TableHead>
        <TableHead>Status</TableHead>
        <TableHead class="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each data.items as item (item.id)}
        <TableRow>
          <TableCell class="font-medium">{item.name}</TableCell>
          <TableCell>{item.category?.title || "-"}</TableCell>
          <TableCell>{item.setName || "-"}</TableCell>
          <TableCell class={getStockStatus(item.stockQty)}>{item.stockQty}</TableCell>
          <TableCell>
            {#if item.stockQty === 0}
              <span class="font-medium text-destructive">Out of Stock</span>
            {:else if item.stockQty < 10}
              <span class="font-medium text-yellow-600">Low Stock</span>
            {:else}
              <span class="font-medium text-green-600">In Stock</span>
            {/if}
          </TableCell>
          <TableCell class="text-right">
            <Button variant="outline" size="sm" onclick={() => openStockDialog(item)}>
              Update Stock
            </Button>
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>

<Dialog bind:open={dialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Update Stock - {selectedItem?.name}</DialogTitle>
      <DialogDescription>
        Current stock: {selectedItem?.stockQty}
      </DialogDescription>
    </DialogHeader>
    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label>Operation</Label>
        <div class="flex gap-2">
          <Button
            variant={stockUpdate.operation === "set" ? "default" : "outline"}
            size="sm"
            onclick={() => (stockUpdate.operation = "set")}
          >
            Set To
          </Button>
          <Button
            variant={stockUpdate.operation === "add" ? "default" : "outline"}
            size="sm"
            onclick={() => (stockUpdate.operation = "add")}
          >
            Add
          </Button>
          <Button
            variant={stockUpdate.operation === "subtract" ? "default" : "outline"}
            size="sm"
            onclick={() => (stockUpdate.operation = "subtract")}
          >
            Subtract
          </Button>
        </div>
      </div>
      <div class="grid gap-2">
        <Label for="stockQty">
          {stockUpdate.operation === "set" ? "New Stock" : "Quantity"}
        </Label>
        <Input id="stockQty" type="number" min="0" bind:value={stockUpdate.stockQty} required />
      </div>
      {#if stockUpdate.operation !== "set" && selectedItem}
        <div class="text-sm text-muted-foreground">
          New stock will be:
          {stockUpdate.operation === "add"
            ? selectedItem.stockQty + parseInt(stockUpdate.stockQty || "0")
            : selectedItem.stockQty - parseInt(stockUpdate.stockQty || "0")}
        </div>
      {/if}
    </div>
    <DialogFooter>
      <Button variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
      <Button onclick={handleStockUpdate}>Update</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
