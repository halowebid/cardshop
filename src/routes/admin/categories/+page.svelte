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
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to create category")
        return
      }

      toast.success("Category created successfully")
      dialogOpen = false
      resetForm()
      await invalidateAll()
    } catch {
      toast.error("Failed to create category")
    }
  }

  async function handleEdit() {
    if (!selectedCategory) return

    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to update category")
        return
      }

      toast.success("Category updated successfully")
      editDialogOpen = false
      selectedCategory = null
      resetForm()
      await invalidateAll()
    } catch {
      toast.error("Failed to update category")
    }
  }

  async function handleDelete() {
    if (!selectedCategory) return

    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to delete category")
        return
      }

      toast.success("Category deleted successfully")
      deleteDialogOpen = false
      selectedCategory = null
      await invalidateAll()
    } catch {
      toast.error("Failed to delete category")
    }
  }

  interface Category {
    id: number
    title: string
    imageUrl?: string
    description?: string
    itemCount?: number
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
        <Button onclick={handleCreate}>Create</Button>
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
      {#each data.categories as category (category.id)}
        <TableRow>
          <TableCell class="font-medium">{category.title}</TableCell>
          <TableCell>{category.description || "-"}</TableCell>
          <TableCell>{category.itemCount || 0}</TableCell>
          <TableCell class="text-right">
            <Button variant="ghost" size="sm" onclick={() => openEditDialog(category)}>Edit</Button>
            <Button variant="ghost" size="sm" onclick={() => openDeleteDialog(category)}>
              Delete
            </Button>
          </TableCell>
        </TableRow>
      {/each}
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
      <Button onclick={handleEdit}>Update</Button>
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
      <Button variant="destructive" onclick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
