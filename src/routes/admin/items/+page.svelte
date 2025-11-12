<script lang="ts">
  import { browser } from "$app/environment"
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
  import { useCategories } from "$lib/queries/categories"
  import { useCreateItem, useDeleteItem, useItems, useUpdateItem } from "$lib/queries/items"
  import { toast } from "svelte-sonner"

  // Queries - fetch on client only
  const itemsQuery = useItems()
  const categoriesQuery = useCategories()

  // Mutations
  const createMutation = useCreateItem()
  const updateMutation = useUpdateItem()
  const deleteMutation = useDeleteItem()

  interface ItemData {
    id: string
    categoryId: string
    name: string
    setName: string | null
    rarity: string | null
    price: string
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

  function handleCreate() {
    if (!selectedCategoryValue) {
      toast.error("Please select a category")
      return
    }

    createMutation.mutate(
      {
        categoryId: selectedCategoryValue,
        name: formData.name,
        setName: formData.setName || null,
        rarity: formData.rarity || null,
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl || null,
        description: formData.description || null,
        stockQty: parseInt(formData.stockQty),
      },
      {
        onSuccess: () => {
          dialogOpen = false
          resetForm()
        },
      },
    )
  }

  function handleEdit() {
    if (!selectedItem || !editSelectedCategoryValue) return

    updateMutation.mutate(
      {
        id: selectedItem.id,
        data: {
          categoryId: editSelectedCategoryValue,
          name: formData.name,
          setName: formData.setName || null,
          rarity: formData.rarity || null,
          price: parseFloat(formData.price),
          imageUrl: formData.imageUrl || null,
          description: formData.description || null,
          stockQty: parseInt(formData.stockQty),
        },
      },
      {
        onSuccess: () => {
          editDialogOpen = false
          selectedItem = null
          resetForm()
        },
      },
    )
  }

  function handleDelete() {
    if (!selectedItem) return

    deleteMutation.mutate(selectedItem.id, {
      onSuccess: () => {
        deleteDialogOpen = false
        selectedItem = null
      },
    })
  }

  function openEditDialog(item: ItemData) {
    selectedItem = item
    formData = {
      categoryId: item.categoryId,
      name: item.name,
      setName: item.setName || "",
      rarity: item.rarity || "",
      price: item.price,
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
              {categoriesQuery.data?.find((c: CategoryData) => c.id === selectedCategoryValue)
                ?.title ?? "Select category"}
            </SelectTrigger>
            <SelectContent>
              {#each categoriesQuery.data ?? [] as category (category.id)}
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
        <Button onclick={handleCreate} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>

<div class="mt-4 rounded-md border">
  {#if itemsQuery.isLoading || categoriesQuery.isLoading}
    <div class="flex items-center justify-center p-8">
      <p class="text-muted-foreground">Loading items...</p>
    </div>
  {:else if itemsQuery.isError}
    <div class="flex items-center justify-center p-8">
      <p class="text-destructive">Error loading items: {itemsQuery.error.message}</p>
    </div>
  {:else if itemsQuery.data}
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
        {#each itemsQuery.data as item (item.id)}
          <TableRow>
            <TableCell class="font-medium">{item.name}</TableCell>
            <TableCell>{item.category?.title || "-"}</TableCell>
            <TableCell>{item.setName || "-"}</TableCell>
            <TableCell>{item.rarity || "-"}</TableCell>
            <TableCell>${item.price}</TableCell>
            <TableCell>{item.stockQty}</TableCell>
            <TableCell class="text-right">
              <Button variant="ghost" size="sm" onclick={() => openEditDialog(item)}>Edit</Button>
              <Button variant="ghost" size="sm" onclick={() => openDeleteDialog(item)}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  {/if}
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
            {categoriesQuery.data?.find((c: CategoryData) => c.id === editSelectedCategoryValue)
              ?.title ?? "Select category"}
          </SelectTrigger>
          <SelectContent>
            {#each categoriesQuery.data ?? [] as category (category.id)}
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
      <Button onclick={handleEdit} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? "Updating..." : "Update"}
      </Button>
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
      <Button variant="destructive" onclick={handleDelete} disabled={deleteMutation.isPending}>
        {deleteMutation.isPending ? "Deleting..." : "Delete"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
