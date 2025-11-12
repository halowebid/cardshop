<script lang="ts">
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table"
  import { Textarea } from "$lib/components/ui/textarea"
  import {
    useCategories,
    useCreateCategory,
    useDeleteCategory,
    useUpdateCategory,
    type Category,
  } from "$lib/queries/categories"
  import { toast } from "svelte-sonner"

  const categoriesQuery = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  let dialogOpen = $state(false)
  let editDialogOpen = $state(false)
  let deleteDialogOpen = $state(false)
  let selectedCategory = $state<Category | null>(null)

  let formData = $state({
    title: "",
    imageUrl: "",
    description: "",
  })

  function resetForm() {
    formData = { title: "", imageUrl: "", description: "" }
  }

  async function handleCreate() {
    try {
      await createMutation.mutateAsync(formData)
      toast.success("Category created successfully")
      dialogOpen = false
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create category")
    }
  }

  async function handleEdit() {
    if (!selectedCategory) return

    try {
      await updateMutation.mutateAsync({
        id: selectedCategory.id,
        data: formData,
      })
      toast.success("Category updated successfully")
      editDialogOpen = false
      selectedCategory = null
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update category")
    }
  }

  async function handleDelete() {
    if (!selectedCategory) return

    try {
      await deleteMutation.mutateAsync(selectedCategory.id)
      toast.success("Category deleted successfully")
      deleteDialogOpen = false
      selectedCategory = null
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category")
    }
  }

  function openEditDialog(category: Category) {
    selectedCategory = category
    formData = {
      title: category.title,
      imageUrl: category.imageUrl || "",
      description: category.description || "",
    }
    editDialogOpen = true
  }

  function openDeleteDialog(category: Category) {
    selectedCategory = category
    deleteDialogOpen = true
  }
</script>

<div class="flex items-center justify-between">
  <h2 class="text-2xl font-bold">Categories</h2>
  <Dialog bind:open={dialogOpen}>
    <DialogTrigger>
      <Button>Add Category</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Category</DialogTitle>
        <DialogDescription>Add a new product category</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="title">Title</Label>
          <Input id="title" bind:value={formData.title} required />
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
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Title</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Items</TableHead>
        <TableHead class="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#if categoriesQuery.isLoading}
        <TableRow>
          <TableCell colspan={4} class="text-center">Loading categories...</TableCell>
        </TableRow>
      {:else if categoriesQuery.error}
        <TableRow>
          <TableCell colspan={4} class="text-center text-red-500">
            Error: {categoriesQuery.error.message}
          </TableCell>
        </TableRow>
      {:else if categoriesQuery.data && categoriesQuery.data.length > 0}
        {#each categoriesQuery.data as category (category.id)}
          <TableRow>
            <TableCell class="font-medium">{category.title}</TableCell>
            <TableCell>{category.description || "-"}</TableCell>
            <TableCell>{category.itemCount || 0}</TableCell>
            <TableCell class="text-right">
              <Button
                variant="ghost"
                size="sm"
                onclick={() => openEditDialog(category)}
                disabled={updateMutation.isPending}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onclick={() => openDeleteDialog(category)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        {/each}
      {:else}
        <TableRow>
          <TableCell colspan={4} class="text-center">No categories found</TableCell>
        </TableRow>
      {/if}
    </TableBody>
  </Table>
</div>

<Dialog bind:open={editDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Category</DialogTitle>
      <DialogDescription>Update category details</DialogDescription>
    </DialogHeader>
    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="edit-title">Title</Label>
        <Input id="edit-title" bind:value={formData.title} required />
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
      <DialogTitle>Delete Category</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete "{selectedCategory?.title}"? This action cannot be undone.
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
