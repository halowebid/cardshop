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
    DialogTrigger,
  } from "$lib/components/ui/dialog"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import {
    Content as SelectContent,
    Item as SelectItem,
    Root as SelectRoot,
    Trigger as SelectTrigger,
  } from "$lib/components/ui/select"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table"
  import { Textarea } from "$lib/components/ui/textarea"
  import { toast } from "svelte-sonner"

  let { data } = $props()

  interface ItemData {
    id: number
    categoryId: string
    name: string
    setName: string | null
    rarity: string | null
    price: number
    imageUrl: string | null
    description: string | null
    stockQty: number
    category?: { title: string } | null
  }

  interface CategoryData {
    id: string
    title: string
  }

  let dialogOpen = $state(false)
  let editDialogOpen = $state(false)
  let deleteDialogOpen = $state(false)
  let selectedItem = $state<ItemData | null>(null)

  let formData = $state({
    categoryId: "",
    name: "",
    setName: "",
    rarity: "",
    price: "",
    imageUrl: "",
    description: "",
    stockQty: "0",
  })

  let selectedCategoryValue = $state<string | undefined>(undefined)
  let editSelectedCategoryValue = $state<string | undefined>(undefined)

  function resetForm() {
    formData = {
      categoryId: "",
      name: "",
      setName: "",
      rarity: "",
      price: "",
      imageUrl: "",
      description: "",
      stockQty: "0",
    }
    selectedCategoryValue = undefined
    editSelectedCategoryValue = undefined
  }

  async function handleCreate() {
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryId: selectedCategoryValue,
          price: parseFloat(formData.price),
          stockQty: parseInt(formData.stockQty),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to create item")
        return
      }

      toast.success("Item created successfully")
      dialogOpen = false
      resetForm()
      await invalidateAll()
    } catch {
      toast.error("Failed to create item")
    }
  }

  async function handleEdit() {
    if (!selectedItem) return

    try {
      const response = await fetch(`/api/items/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryId: editSelectedCategoryValue,
          price: parseFloat(formData.price),
          stockQty: parseInt(formData.stockQty),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to update item")
        return
      }

      toast.success("Item updated successfully")
      editDialogOpen = false
      selectedItem = null
      resetForm()
      await invalidateAll()
    } catch {
      toast.error("Failed to update item")
    }
  }

  async function handleDelete() {
    if (!selectedItem) return

    try {
      const response = await fetch(`/api/items/${selectedItem.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to delete item")
        return
      }

      toast.success("Item deleted successfully")
      deleteDialogOpen = false
      selectedItem = null
      await invalidateAll()
    } catch {
      toast.error("Failed to delete item")
    }
  }

  function openEditDialog(item: ItemData) {
    selectedItem = item
    formData = {
      categoryId: item.categoryId,
      name: item.name,
      setName: item.setName || "",
      rarity: item.rarity || "",
      price: item.price.toString(),
      imageUrl: item.imageUrl || "",
      description: item.description || "",
      stockQty: item.stockQty.toString(),
    }
    editSelectedCategoryValue = item.categoryId
    editDialogOpen = true
  }

  function openDeleteDialog(item: ItemData) {
    selectedItem = item
    deleteDialogOpen = true
  }
</script>

<div class="flex items-center justify-between">
  <h2 class="text-2xl font-bold">Items</h2>
  <Dialog bind:open={dialogOpen}>
    <DialogTrigger>
      <Button>Add Item</Button>
    </DialogTrigger>
    <DialogContent class="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Item</DialogTitle>
        <DialogDescription>Add a new product item</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="category">Category</Label>
          <SelectRoot type="single" bind:value={selectedCategoryValue}>
            <SelectTrigger>
              {data.categories.find((c: CategoryData) => c.id === selectedCategoryValue)?.title ??
                "Select category"}
            </SelectTrigger>
            <SelectContent>
              {#each data.categories as category (category.id)}
                <SelectItem value={category.id}>{category.title}</SelectItem>
              {/each}
            </SelectContent>
          </SelectRoot>
        </div>
        <div class="grid gap-2">
          <Label for="name">Name</Label>
          <Input id="name" bind:value={formData.name} required />
        </div>
        <div class="grid gap-2">
          <Label for="setName">Set Name</Label>
          <Input id="setName" bind:value={formData.setName} />
        </div>
        <div class="grid gap-2">
          <Label for="rarity">Rarity</Label>
          <Input id="rarity" bind:value={formData.rarity} />
        </div>
        <div class="grid gap-2">
          <Label for="price">Price</Label>
          <Input id="price" type="number" step="0.01" bind:value={formData.price} required />
        </div>
        <div class="grid gap-2">
          <Label for="stockQty">Stock Quantity</Label>
          <Input id="stockQty" type="number" bind:value={formData.stockQty} required />
        </div>
        <div class="grid gap-2">
          <Label for="imageUrl">Image URL</Label>
          <Input id="imageUrl" bind:value={formData.imageUrl} />
        </div>
        <div class="grid gap-2">
          <Label for="description">Description</Label>
          <Textarea id="description" bind:value={formData.description} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
        <Button onclick={handleCreate}>Create</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>

<div class="mt-4 rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Category</TableHead>
        <TableHead>Set</TableHead>
        <TableHead>Rarity</TableHead>
        <TableHead>Price</TableHead>
        <TableHead>Stock</TableHead>
        <TableHead class="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each data.items as item (item.id)}
        <TableRow>
          <TableCell class="font-medium">{item.name}</TableCell>
          <TableCell>{item.category?.title || "-"}</TableCell>
          <TableCell>{item.setName || "-"}</TableCell>
          <TableCell>{item.rarity || "-"}</TableCell>
          <TableCell>${item.price}</TableCell>
          <TableCell>{item.stockQty}</TableCell>
          <TableCell class="text-right">
            <Button variant="ghost" size="sm" onclick={() => openEditDialog(item)}>Edit</Button>
            <Button variant="ghost" size="sm" onclick={() => openDeleteDialog(item)}>Delete</Button>
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>

<Dialog bind:open={editDialogOpen}>
  <DialogContent class="max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Edit Item</DialogTitle>
      <DialogDescription>Update item details</DialogDescription>
    </DialogHeader>
    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="edit-category">Category</Label>
        <SelectRoot type="single" bind:value={editSelectedCategoryValue}>
          <SelectTrigger>
            {data.categories.find((c: CategoryData) => c.id === editSelectedCategoryValue)?.title ??
              "Select category"}
          </SelectTrigger>
          <SelectContent>
            {#each data.categories as category (category.id)}
              <SelectItem value={category.id}>{category.title}</SelectItem>
            {/each}
          </SelectContent>
        </SelectRoot>
      </div>
      <div class="grid gap-2">
        <Label for="edit-name">Name</Label>
        <Input id="edit-name" bind:value={formData.name} required />
      </div>
      <div class="grid gap-2">
        <Label for="edit-setName">Set Name</Label>
        <Input id="edit-setName" bind:value={formData.setName} />
      </div>
      <div class="grid gap-2">
        <Label for="edit-rarity">Rarity</Label>
        <Input id="edit-rarity" bind:value={formData.rarity} />
      </div>
      <div class="grid gap-2">
        <Label for="edit-price">Price</Label>
        <Input id="edit-price" type="number" step="0.01" bind:value={formData.price} required />
      </div>
      <div class="grid gap-2">
        <Label for="edit-stockQty">Stock Quantity</Label>
        <Input id="edit-stockQty" type="number" bind:value={formData.stockQty} required />
      </div>
      <div class="grid gap-2">
        <Label for="edit-imageUrl">Image URL</Label>
        <Input id="edit-imageUrl" bind:value={formData.imageUrl} />
      </div>
      <div class="grid gap-2">
        <Label for="edit-description">Description</Label>
        <Textarea id="edit-description" bind:value={formData.description} />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onclick={() => (editDialogOpen = false)}>Cancel</Button>
      <Button onclick={handleEdit}>Update</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog bind:open={deleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Item</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onclick={() => (deleteDialogOpen = false)}>Cancel</Button>
      <Button variant="destructive" onclick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
