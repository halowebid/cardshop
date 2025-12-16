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
  import { useDeleteRarity, useRarities } from "$lib/queries/rarities"

  let currentPage = $state(1)
  const ITEMS_PER_PAGE = 20

  const raritiesQuery = useRarities(() => currentPage, ITEMS_PER_PAGE)
  const deleteMutation = useDeleteRarity()

  function handleEdit(rarityId: string) {
    goto(`/admin/rarities/${rarityId}/edit`)
  }

  function handleDelete(rarityId: string, rarityName: string) {
    if (confirm(`Are you sure you want to delete "${rarityName}"?`)) {
      deleteMutation.mutate(rarityId)
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
  <title>Rarities - Admin</title>
</svelte:head>

<div class="container mx-auto py-8">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">Rarities</h1>
      <p class="text-muted-foreground">Manage item rarity levels</p>
    </div>
    <Button onclick={() => goto("/admin/rarities/new")}>
      <PlusIcon class="mr-2 h-4 w-4" />
      Add Rarity
    </Button>
  </div>

  {#if raritiesQuery.isLoading}
    <div class="flex justify-center py-8">
      <p class="text-muted-foreground">Loading rarities...</p>
    </div>
  {:else if raritiesQuery.error}
    <div class="rounded-lg border border-destructive bg-destructive/10 p-4">
      <p class="text-destructive">Error loading rarities: {raritiesQuery.error.message}</p>
    </div>
  {:else if raritiesQuery.data}
    <div class="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each raritiesQuery.data.data as rarity (rarity.id)}
            <TableRow>
              <TableCell class="font-medium">
                <div class="flex items-center gap-2">
                  <div
                    class="h-4 w-4 rounded-full border"
                    style="background-color: {rarity.color ?? '#9CA3AF'}"
                    title={rarity.color ?? "No color"}
                  ></div>
                  {rarity.name}
                </div>
              </TableCell>
              <TableCell class="font-mono text-sm text-muted-foreground">
                {rarity.slug ?? "-"}
              </TableCell>
              <TableCell>{rarity.itemCount ?? 0}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(rarity.status)}>
                  {rarity.status}
                </Badge>
              </TableCell>
              <TableCell>
                {#if rarity.visibility}
                  <Badge variant="default">Visible</Badge>
                {:else}
                  <Badge variant="outline">Hidden</Badge>
                {/if}
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onclick={() => handleEdit(rarity.id)}>
                    <PencilIcon class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onclick={() => handleDelete(rarity.id, rarity.name)}
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
                No rarities found. Create your first rarity to get started.
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>

    {#if raritiesQuery.data.meta.totalPages > 1}
      <div class="mt-4 flex items-center justify-between">
        <p class="text-sm text-muted-foreground">
          Page {raritiesQuery.data.meta.page} of {raritiesQuery.data.meta.totalPages}
          ({raritiesQuery.data.meta.total} total rarities)
        </p>
        <Pagination count={raritiesQuery.data.meta.totalPages} perPage={1}>
          <PaginationContent>
            <PaginationPrevButton
              disabled={currentPage === 1}
              onclick={() => {
                if (currentPage > 1) currentPage--
              }}
            />
            <PaginationNextButton
              disabled={!raritiesQuery.data.meta.hasMore}
              onclick={() => {
                if (raritiesQuery.data.meta.hasMore) currentPage++
              }}
            />
          </PaginationContent>
        </Pagination>
      </div>
    {/if}
  {/if}
</div>
