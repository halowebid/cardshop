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
  import { useDeleteTag, useTags } from "$lib/queries/tags"

  let currentPage = $state(1)
  const ITEMS_PER_PAGE = 20

  const tagsQuery = useTags(() => currentPage, ITEMS_PER_PAGE)
  const deleteMutation = useDeleteTag()

  function handleEdit(tagId: string) {
    goto(`/admin/tags/${tagId}/edit`)
  }

  function handleDelete(tagId: string, tagName: string) {
    if (confirm(`Are you sure you want to delete "${tagName}"?`)) {
      deleteMutation.mutate(tagId)
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
  <title>Tags - Admin</title>
</svelte:head>

<div class="container mx-auto py-8">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">Tags</h1>
      <p class="text-muted-foreground">Organize items with tags</p>
    </div>
    <Button onclick={() => goto("/admin/tags/new")}>
      <PlusIcon class="mr-2 h-4 w-4" />
      Add Tag
    </Button>
  </div>

  {#if tagsQuery.isLoading}
    <div class="flex justify-center py-8">
      <p class="text-muted-foreground">Loading tags...</p>
    </div>
  {:else if tagsQuery.error}
    <div class="rounded-lg border border-destructive bg-destructive/10 p-4">
      <p class="text-destructive">Error loading tags: {tagsQuery.error.message}</p>
    </div>
  {:else if tagsQuery.data}
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
          {#each tagsQuery.data.data as tag (tag.id)}
            <TableRow>
              <TableCell class="font-medium">{tag.name}</TableCell>
              <TableCell class="font-mono text-sm text-muted-foreground">
                {tag.slug ?? "-"}
              </TableCell>
              <TableCell>{tag.itemCount ?? 0}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(tag.status)}>
                  {tag.status}
                </Badge>
              </TableCell>
              <TableCell>
                {#if tag.visibility}
                  <Badge variant="default">Visible</Badge>
                {:else}
                  <Badge variant="outline">Hidden</Badge>
                {/if}
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onclick={() => handleEdit(tag.id)}>
                    <PencilIcon class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onclick={() => handleDelete(tag.id, tag.name)}
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
                No tags found. Create your first tag to get started.
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>

    {#if tagsQuery.data.meta.totalPages > 1}
      <div class="mt-4 flex items-center justify-between">
        <p class="text-sm text-muted-foreground">
          Page {tagsQuery.data.meta.page} of {tagsQuery.data.meta.totalPages}
          ({tagsQuery.data.meta.total} total tags)
        </p>
        <Pagination count={tagsQuery.data.meta.totalPages} perPage={1}>
          <PaginationContent>
            <PaginationPrevButton
              disabled={currentPage === 1}
              onclick={() => {
                if (currentPage > 1) currentPage--
              }}
            />
            <PaginationNextButton
              disabled={!tagsQuery.data.meta.hasMore}
              onclick={() => {
                if (tagsQuery.data.meta.hasMore) currentPage++
              }}
            />
          </PaginationContent>
        </Pagination>
      </div>
    {/if}
  {/if}
</div>
