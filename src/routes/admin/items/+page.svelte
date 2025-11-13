<script lang="ts">
  import { browser } from "$app/environment"
  import { Button } from "$lib/components/ui/button"
  import { Checkbox } from "$lib/components/ui/checkbox"
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table"
  import { Textarea } from "$lib/components/ui/textarea"
  import { useCategories, useCreateCategory } from "$lib/queries/categories"
  import { useCreateItem, useDeleteItem, useItems, useUpdateItem } from "$lib/queries/items"
  import { toast } from "svelte-sonner"

  // Queries - fetch on client only
  const itemsQuery = useItems()
  const categoriesQuery = useCategories()

  // Mutations
  const createMutation = useCreateItem()
  const updateMutation = useUpdateItem()
  const deleteMutation = useDeleteItem()
  const createCategoryMutation = useCreateCategory()

  interface ItemData {
    id: string
    categoryIds: string[]
    name: string
    setName: string | null
    rarity: string | null
    price: string
    imageUrl: string | null
    description: string | null
    stockQty: number
    categories?: Array<{ id: string; title: string }> | null
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
    categoryIds: [] as string[],
    name: "",
    setName: "",
    rarity: "",
    price: "",
    imageUrl: "",
    description: "",
    stockQty: "0",
  })

  let categorySearchTerm = $state("")
  let showCreateCategory = $state(false)

  function resetForm() {
    formData = {
      categoryIds: [],
      name: "",
      setName: "",
      rarity: "",
      price: "",
      imageUrl: "",
      description: "",
      stockQty: "0",
    }
    categorySearchTerm = ""
    showCreateCategory = false
  }

  function toggleCategory(categoryId: string) {
    if (formData.categoryIds.includes(categoryId)) {
      formData.categoryIds = formData.categoryIds.filter((id) => id !== categoryId)
    } else {
      formData.categoryIds = [...formData.categoryIds, categoryId]
    }
  }

  const filteredCategories = $derived(
    (categoriesQuery.data ?? []).filter((c: CategoryData) =>
      c.title.toLowerCase().includes(categorySearchTerm.toLowerCase()),
    ),
  )

  const exactMatch = $derived(
    (categoriesQuery.data ?? []).find(
      (c: CategoryData) => c.title.toLowerCase() === categorySearchTerm.toLowerCase(),
    ),
  )

  function handleCreateCategory() {
    if (!categorySearchTerm.trim()) {
      toast.error("Please enter a category name")
      return
    }

    createCategoryMutation.mutate(
      { title: categorySearchTerm.trim() },
      {
        onSuccess: (newCategory) => {
          toast.success(`Category "${newCategory.title}" created`)
          formData.categoryIds = [...formData.categoryIds, newCategory.id]
          categorySearchTerm = ""
          showCreateCategory = false
        },
        onError: (error) => {
          toast.error(error.message)
        },
      },
    )
  }

  function handleCreate() {
    if (formData.categoryIds.length === 0) {
      toast.error("Please select at least one category")
      return
    }

    createMutation.mutate(
      {
        categoryIds: formData.categoryIds,
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
    if (!selectedItem) return

    if (formData.categoryIds.length === 0) {
      toast.error("Please select at least one category")
      return
    }

    updateMutation.mutate(
      {
        id: selectedItem.id,
        data: {
          categoryIds: formData.categoryIds,
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
      categoryIds: item.categoryIds,
      name: item.name,
      setName: item.setName || "",
      rarity: item.rarity || "",
      price: item.price,
      imageUrl: item.imageUrl || "",
      description: item.description || "",
      stockQty: item.stockQty.toString(),
    }
    categorySearchTerm = ""
    showCreateCategory = false
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
          <Label for="category">Categories</Label>
          <div class="rounded-md border p-3">
            <Input
              placeholder="Search or create category..."
              bind:value={categorySearchTerm}
              class="mb-3"
            />
            <div class="max-h-48 space-y-2 overflow-y-auto">
              {#if filteredCategories.length > 0}
                {#each filteredCategories as category (category.id)}
                  <div class="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={formData.categoryIds.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <Label for={`category-${category.id}`} class="flex-1 cursor-pointer">
                      {category.title}
                    </Label>
                  </div>
                {/each}
              {/if}
              {#if categorySearchTerm && !exactMatch}
                <Button
                  variant="outline"
                  size="sm"
                  class="w-full"
                  onclick={handleCreateCategory}
                  disabled={createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending
                    ? "Creating..."
                    : `Create "${categorySearchTerm}"`}
                </Button>
              {/if}
              {#if filteredCategories.length === 0 && !categorySearchTerm}
                <p class="text-sm text-muted-foreground">No categories available</p>
              {/if}
              {#if filteredCategories.length === 0 && categorySearchTerm && exactMatch}
                <p class="text-sm text-muted-foreground">No matching categories</p>
              {/if}
            </div>
            {#if formData.categoryIds.length > 0}
              <div class="mt-3 border-t pt-3">
                <p class="text-sm font-medium">
                  Selected ({formData.categoryIds.length}):
                </p>
                <div class="mt-1 flex flex-wrap gap-1">
                  {#each formData.categoryIds as categoryId (categoryId)}
                    {@const category = categoriesQuery.data?.find(
                      (c: CategoryData) => c.id === categoryId,
                    )}
                    {#if category}
                      <span
                        class="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
                      >
                        {category.title}
                        <button
                          type="button"
                          onclick={() => toggleCategory(categoryId)}
                          class="hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    {/if}
                  {/each}
                </div>
              </div>
            {/if}
          </div>
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
            <TableCell>
              {#if item.categories && item.categories.length > 0}
                {item.categories.map((c) => c.title).join(", ")}
              {:else}
                -
              {/if}
            </TableCell>
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
        <Label for="edit-category">Categories</Label>
        <div class="rounded-md border p-3">
          <Input
            placeholder="Search or create category..."
            bind:value={categorySearchTerm}
            class="mb-3"
          />
          <div class="max-h-48 space-y-2 overflow-y-auto">
            {#if filteredCategories.length > 0}
              {#each filteredCategories as category (category.id)}
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-category-${category.id}`}
                    checked={formData.categoryIds.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <Label for={`edit-category-${category.id}`} class="flex-1 cursor-pointer">
                    {category.title}
                  </Label>
                </div>
              {/each}
            {/if}
            {#if categorySearchTerm && !exactMatch}
              <Button
                variant="outline"
                size="sm"
                class="w-full"
                onclick={handleCreateCategory}
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending
                  ? "Creating..."
                  : `Create "${categorySearchTerm}"`}
              </Button>
            {/if}
            {#if filteredCategories.length === 0 && !categorySearchTerm}
              <p class="text-sm text-muted-foreground">No categories available</p>
            {/if}
            {#if filteredCategories.length === 0 && categorySearchTerm && exactMatch}
              <p class="text-sm text-muted-foreground">No matching categories</p>
            {/if}
          </div>
          {#if formData.categoryIds.length > 0}
            <div class="mt-3 border-t pt-3">
              <p class="text-sm font-medium">
                Selected ({formData.categoryIds.length}):
              </p>
              <div class="mt-1 flex flex-wrap gap-1">
                {#each formData.categoryIds as categoryId (categoryId)}
                  {@const category = categoriesQuery.data?.find(
                    (c: CategoryData) => c.id === categoryId,
                  )}
                  {#if category}
                    <span
                      class="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
                    >
                      {category.title}
                      <button
                        type="button"
                        onclick={() => toggleCategory(categoryId)}
                        class="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        </div>
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
