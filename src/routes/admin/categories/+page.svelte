<script lang="ts">
  import PencilIcon from "@lucide/svelte/icons/pencil"
  import PlusIcon from "@lucide/svelte/icons/plus"
  import Trash2Icon from "@lucide/svelte/icons/trash-2"
  import { goto } from "$app/navigation"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import {
    Pagination,
    PaginationContent,
    PaginationNextButton,
    PaginationPrevButton,
  } from "$lib/components/ui/pagination"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table"
  import { useCategories, useDeleteCategory } from "$lib/queries/categories"

  let currentPage = $state(1)
  const ITEMS_PER_PAGE = 20

  const categoriesQuery = useCategories(() => currentPage, ITEMS_PER_PAGE)
  const deleteMutation = useDeleteCategory()

  function handleEdit(categoryId: string) {
    goto(`/admin/categories/${categoryId}/edit`)
  }

  function handleDelete(categoryId: string, categoryTitle: string) {
    if (confirm(`Are you sure you want to delete "${categoryTitle}"?`)) {
      deleteMutation.mutate(categoryId)
    }
  }

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case "active":
        return "default"
      case "draft":
        return "secondary"
      case "archived":
        return "outline"
      default:
        return "secondary"
    }
  }
</script>

<svelte:head>
  <title>Categories - Admin</title>
</svelte:head>

<div class="container mx-auto py-8">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">Categories</h1>
      <p class="text-muted-foreground">Organize your items into categories</p>
    </div>
    <Button onclick={() => goto("/admin/categories/new")}>
      <PlusIcon class="mr-2 h-4 w-4" />
      Add Category
    </Button>
  </div>

  {#if categoriesQuery.isLoading}
    <div class="flex justify-center py-8">
      <p class="text-muted-foreground">Loading categories...</p>
    </div>
  {:else if categoriesQuery.error}
    <div class="rounded-lg border border-destructive bg-destructive/10 p-4">
      <p class="text-destructive">Error loading categories: {categoriesQuery.error.message}</p>
    </div>
  {:else if categoriesQuery.data}
    <div class="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each categoriesQuery.data.data as category}
            <TableRow>
              <TableCell class="font-medium">
                <div class="flex items-center gap-2">
                  {#if category.imageUrl}
                    <img
                      src={category.imageUrl}
                      alt={category.title}
                      class="h-10 w-10 rounded object-cover"
                    />
                  {/if}
                  {category.title}
                </div>
              </TableCell>
              <TableCell class="font-mono text-sm text-muted-foreground">
                {category.slug ?? "-"}
              </TableCell>
              <TableCell>{category.itemCount ?? 0}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(category.status)}>
                  {category.status}
                </Badge>
              </TableCell>
              <TableCell>
                {#if category.visibility}
                  <Badge variant="default">Visible</Badge>
                {:else}
                  <Badge variant="outline">Hidden</Badge>
                {/if}
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onclick={() => handleEdit(category.id)}>
                    <PencilIcon class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onclick={() => handleDelete(category.id, category.title)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2Icon class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          {:else}
            <TableRow>
              <TableCell colspan={6} class="text-center text-muted-foreground">
                No categories found. Create your first category to get started.
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>

    {#if categoriesQuery.data.meta.totalPages > 1}
      <div class="mt-4 flex items-center justify-between">
        <p class="text-sm text-muted-foreground">
          Page {categoriesQuery.data.meta.page} of {categoriesQuery.data.meta.totalPages}
          ({categoriesQuery.data.meta.total} total categories)
        </p>
        <Pagination count={categoriesQuery.data.meta.totalPages} perPage={1}>
          <PaginationContent>
            <PaginationPrevButton
              disabled={currentPage === 1}
              onclick={() => {
                if (currentPage > 1) currentPage--
              }}
            />
            <PaginationNextButton
              disabled={!categoriesQuery.data.meta.hasMore}
              onclick={() => {
                if (categoriesQuery.data.meta.hasMore) currentPage++
              }}
            />
          </PaginationContent>
        </Pagination>
      </div>
    {/if}
  {/if}
</div>
