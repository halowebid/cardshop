<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-circle"
  import SaveIcon from "@lucide/svelte/icons/save"
  import { goto } from "$app/navigation"
  import FormSidebar from "$lib/components/admin/form-sidebar.svelte"
  import ImageUpload from "$lib/components/admin/image-upload.svelte"
  import RichTextEditor from "$lib/components/admin/rich-text-editor.svelte"
  import SeoFields from "$lib/components/admin/seo-fields.svelte"
  import SlugInput from "$lib/components/admin/slug-input.svelte"
  import StatusSelector from "$lib/components/admin/status-selector.svelte"
  import TagInput from "$lib/components/admin/tag-input.svelte"
  import VisibilityToggle from "$lib/components/admin/visibility-toggle.svelte"
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "$lib/components/ui/breadcrumb"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Separator } from "$lib/components/ui/separator"
  import { useCategories } from "$lib/queries/categories"
  import { useItem, useUpdateItem, type ItemInsert } from "$lib/queries/items"
  import { toast } from "svelte-sonner"

  type Props = {
    data: { itemId: string }
  }

  let { data }: Props = $props()

  const itemId = data.itemId
  const itemQuery = useItem(itemId)
  const updateMutation = useUpdateItem()
  const categoriesQuery = useCategories()

  let formData = $state<ItemInsert | null>(null)
  let lastSavedData = $state<string>("")
  let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null
  let isSaving = $state(false)
  let unsavedChanges = $state(false)

  $effect(() => {
    if (itemQuery.data && !formData) {
      const item = itemQuery.data
      formData = {
        name: item.name,
        categoryIds: item.categoryIds,
        price: item.price,
        stockQty: item.stockQty,
        setName: item.setName,
        rarity: item.rarity,
        imageUrl: item.imageUrl,
        description: item.description,
        slug: item.slug ?? "",
        status: item.status,
        visibility: item.visibility,
        tags: item.tags ?? [],
        metaTitle: item.metaTitle ?? "",
        metaDescription: item.metaDescription ?? "",
        uploadedImageId: item.uploadedImageId ?? "",
      }
      lastSavedData = JSON.stringify(formData)
    }
  })

  $effect(() => {
    if (formData) {
      const currentData = JSON.stringify(formData)
      if (currentData !== lastSavedData) {
        unsavedChanges = true
        scheduleAutoSave()
      }
    }
  })

  function scheduleAutoSave() {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    autoSaveTimeout = setTimeout(() => {
      handleAutoSave()
    }, 3000)
  }

  async function handleAutoSave() {
    if (!formData || !unsavedChanges) return

    isSaving = true
    updateMutation.mutate(
      { id: itemId, data: formData },
      {
        onSuccess: () => {
          lastSavedData = JSON.stringify(formData)
          unsavedChanges = false
          toast.success("Auto-saved", { duration: 1000 })
        },
        onSettled: () => {
          isSaving = false
        },
      },
    )
  }

  function handlePublish() {
    if (!formData) return

    const data: ItemInsert = {
      ...formData,
      status: "active",
      visibility: true,
    }

    updateMutation.mutate(
      { id: itemId, data },
      {
        onSuccess: () => {
          unsavedChanges = false
          goto("/admin/items")
        },
      },
    )
  }

  function handleCancel() {
    if (unsavedChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to leave?")) {
        return
      }
    }
    goto("/admin/items")
  }
</script>

<svelte:head>
  <title>Edit Item - Admin</title>
</svelte:head>

{#if itemQuery.isLoading}
  <div class="flex h-screen items-center justify-center">
    <Loader2Icon class="h-8 w-8 animate-spin" />
  </div>
{:else if itemQuery.error}
  <div class="flex h-screen items-center justify-center">
    <p class="text-destructive">Error loading item: {itemQuery.error.message}</p>
  </div>
{:else if formData}
  <div class="container mx-auto py-6">
    <Breadcrumb class="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin/items">Items</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Edit: {itemQuery.data?.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Edit Item</h1>
        {#if isSaving}
          <p class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon class="h-3 w-3 animate-spin" />
            Saving...
          </p>
        {:else if unsavedChanges}
          <p class="mt-1 text-sm text-muted-foreground">Unsaved changes</p>
        {:else}
          <p class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <SaveIcon class="h-3 w-3" />
            All changes saved
          </p>
        {/if}
      </div>
      <div class="flex gap-2">
        <Button variant="outline" onclick={handleCancel} disabled={updateMutation.isPending}>
          Cancel
        </Button>
        <Button onclick={handlePublish} disabled={updateMutation.isPending}>
          {#if updateMutation.isPending}
            <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          Publish
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <div class="rounded-lg border bg-card p-6">
          <h2 class="mb-4 text-xl font-semibold">Basic Information</h2>
          <div class="space-y-4">
            <div class="space-y-2">
              <Label for="name">Name *</Label>
              <Input
                id="name"
                bind:value={formData!.name}
                placeholder="e.g., Pikachu VMAX"
                required
              />
            </div>

            <SlugInput
              bind:value={formData!.slug}
              sourceText={formData!.name}
              entityType="item"
              excludeId={itemId}
              onchange={(slug) => (formData!.slug = slug)}
            />

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="setName">Set Name</Label>
                <Input
                  id="setName"
                  bind:value={formData!.setName}
                  placeholder="e.g., Vivid Voltage"
                />
              </div>

              <div class="space-y-2">
                <Label for="rarity">Rarity</Label>
                <Input id="rarity" bind:value={formData!.rarity} placeholder="e.g., Ultra Rare" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  bind:value={formData!.price}
                  placeholder="0.00"
                  required
                />
              </div>

              <div class="space-y-2">
                <Label for="stockQty">Stock Quantity</Label>
                <Input
                  id="stockQty"
                  type="number"
                  min="0"
                  bind:value={formData!.stockQty}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border bg-card p-6">
          <h2 class="mb-4 text-xl font-semibold">Description</h2>
          <RichTextEditor
            bind:value={formData!.description}
            onchange={(html) => (formData!.description = html)}
          />
        </div>

        <div class="rounded-lg border bg-card p-6">
          <h2 class="mb-4 text-xl font-semibold">Image</h2>
          <ImageUpload
            bind:value={formData!.imageUrl}
            onchange={(url, fileId) => {
              formData!.imageUrl = url ?? null
              formData!.uploadedImageId = fileId ?? ""
            }}
          />
        </div>

        <SeoFields
          bind:metaTitle={formData!.metaTitle}
          bind:metaDescription={formData!.metaDescription}
          onMetaTitleChange={(value) => (formData!.metaTitle = value)}
          onMetaDescriptionChange={(value) => (formData!.metaDescription = value)}
        />
      </div>

      <div class="lg:col-span-1">
        <FormSidebar>
          <StatusSelector
            bind:value={formData!.status}
            onchange={(status) => (formData!.status = status)}
          />

          <Separator />

          <VisibilityToggle
            bind:value={formData!.visibility}
            onchange={(visible) => (formData!.visibility = visible)}
          />

          <Separator />

          <div class="space-y-2">
            <Label>Categories</Label>
            {#if categoriesQuery.isLoading}
              <p class="text-sm text-muted-foreground">Loading categories...</p>
            {:else if categoriesQuery.data}
              <div class="space-y-2">
                {#each categoriesQuery.data.data as category (category.id)}
                  <label class="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={category.id}
                      checked={formData!.categoryIds.includes(category.id)}
                      onchange={(e) => {
                        const checked = (e.target as HTMLInputElement).checked
                        if (checked) {
                          formData!.categoryIds = [...formData!.categoryIds, category.id]
                        } else {
                          formData!.categoryIds = formData!.categoryIds.filter(
                            (id) => id !== category.id,
                          )
                        }
                      }}
                      class="rounded border-gray-300"
                    />
                    <span class="text-sm">{category.title}</span>
                  </label>
                {/each}
              </div>
            {/if}
          </div>

          <Separator />

          <TagInput bind:value={formData!.tags} onchange={(tags) => (formData!.tags = tags)} />
        </FormSidebar>
      </div>
    </div>
  </div>
{/if}
