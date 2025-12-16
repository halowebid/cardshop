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
  import { useDeleteItem, useItemsPaginated } from "$lib/queries/items"
  import { toast } from "svelte-sonner"

  let currentPage = $state(1)
  const ITEMS_PER_PAGE = 20

  const itemsQuery = useItemsPaginated(() => currentPage, ITEMS_PER_PAGE)
  const deleteMutation = useDeleteItem()

  function handleEdit(itemId: string) {
    goto(`/admin/items/${itemId}/edit`)
  }

  function handleDelete(itemId: string, itemName: string) {
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
      deleteMutation.mutate(itemId)
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
  <title>Items - Admin</title>
</svelte:head>

<div class="container mx-auto py-8">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">Items</h1>
      <p class="text-muted-foreground">Manage your trading card inventory</p>
    </div>
    <Button onclick={() => goto("/admin/items/new")}>
      <PlusIcon class="mr-2 h-4 w-4" />
      Add Item
    </Button>
  </div>

  {#if itemsQuery.isLoading}
    <div class="flex justify-center py-8">
      <p class="text-muted-foreground">Loading items...</p>
    </div>
  {:else if itemsQuery.error}
    <div class="rounded-lg border border-destructive bg-destructive/10 p-4">
      <p class="text-destructive">Error loading items: {itemsQuery.error.message}</p>
    </div>
  {:else if itemsQuery.data}
    <div class="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Set</TableHead>
            <TableHead>Rarity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each itemsQuery.data.data as item}
            <TableRow>
              <TableCell class="font-medium">
                <div class="flex items-center gap-2">
                  {#if item.imageUrl}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      class="h-10 w-10 rounded object-cover"
                    />
                  {/if}
                  {item.name}
                </div>
              </TableCell>
              <TableCell>{item.setName ?? "-"}</TableCell>
              <TableCell>{item.rarity ?? "-"}</TableCell>
              <TableCell>${item.price}</TableCell>
              <TableCell>{item.stockQty}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(item.status)}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                {#if item.visibility}
                  <Badge variant="default">Visible</Badge>
                {:else}
                  <Badge variant="outline">Hidden</Badge>
                {/if}
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onclick={() => handleEdit(item.id)}>
                    <PencilIcon class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onclick={() => handleDelete(item.id, item.name)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2Icon class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          {:else}
            <TableRow>
              <TableCell colspan={8} class="text-center text-muted-foreground">
                No items found. Create your first item to get started.
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>

    {#if itemsQuery.data.meta.totalPages > 1}
      <div class="mt-4 flex items-center justify-between">
        <p class="text-sm text-muted-foreground">
          Page {itemsQuery.data.meta.page} of {itemsQuery.data.meta.totalPages}
          ({itemsQuery.data.meta.total} total items)
        </p>
        <Pagination count={itemsQuery.data.meta.totalPages} perPage={1}>
          <PaginationContent>
            <PaginationPrevButton
              disabled={currentPage === 1}
              onclick={() => {
                if (currentPage > 1) currentPage--
              }}
            />
            <PaginationNextButton
              disabled={!itemsQuery.data.meta.hasMore}
              onclick={() => {
                if (itemsQuery.data.meta.hasMore) currentPage++
              }}
            />
          </PaginationContent>
        </Pagination>
      </div>
    {/if}
  {/if}
</div>
