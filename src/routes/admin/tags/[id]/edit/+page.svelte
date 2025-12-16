<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-circle"
  import SaveIcon from "@lucide/svelte/icons/save"
  import { goto } from "$app/navigation"
  import { page } from "$app/stores"
  import FormSidebar from "$lib/components/admin/form-sidebar.svelte"
  import RichTextEditor from "$lib/components/admin/rich-text-editor.svelte"
  import SeoFields from "$lib/components/admin/seo-fields.svelte"
  import SlugInput from "$lib/components/admin/slug-input.svelte"
  import StatusSelector from "$lib/components/admin/status-selector.svelte"
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
  import { useTag, useUpdateTag, type UpdateTagInput } from "$lib/queries/tags"
  import { toast } from "svelte-sonner"

  const tagId = $page.data.tagId
  const tagQuery = useTag(tagId)
  const updateMutation = useUpdateTag()

  let formData = $state<UpdateTagInput | null>(null)
  let lastSavedData = $state<string>("")
  let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null
  let isSaving = $state(false)
  let unsavedChanges = $state(false)

  $effect(() => {
    if (tagQuery.data && !formData) {
      const tag = tagQuery.data
      formData = {
        name: tag.name,
        slug: tag.slug ?? "",
        description: tag.description,
        status: tag.status,
        visibility: tag.visibility,
        metaTitle: tag.metaTitle ?? "",
        metaDescription: tag.metaDescription ?? "",
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
      { id: tagId, data: formData },
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

    const data: UpdateTagInput = {
      ...formData,
      status: "active",
      visibility: true,
    }

    updateMutation.mutate(
      { id: tagId, data },
      {
        onSuccess: () => {
          unsavedChanges = false
          goto("/admin/tags")
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
    goto("/admin/tags")
  }
</script>

<svelte:head>
  <title>Edit Tag - Admin</title>
</svelte:head>

{#if tagQuery.isLoading}
  <div class="flex h-screen items-center justify-center">
    <Loader2Icon class="h-8 w-8 animate-spin" />
  </div>
{:else if tagQuery.error}
  <div class="flex h-screen items-center justify-center">
    <p class="text-destructive">Error loading tag: {tagQuery.error.message}</p>
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
          <BreadcrumbLink href="/admin/tags">Tags</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Edit: {tagQuery.data?.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Edit Tag</h1>
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
                placeholder="e.g., Holo, First Edition, PSA Graded"
                required
              />
            </div>

            <SlugInput
              bind:value={formData!.slug}
              sourceText={formData!.name}
              entityType="tag"
              excludeId={tagId}
              onchange={(slug) => (formData!.slug = slug)}
            />
          </div>
        </div>

        <div class="rounded-lg border bg-card p-6">
          <h2 class="mb-4 text-xl font-semibold">Description</h2>
          <RichTextEditor
            bind:value={formData!.description}
            onchange={(html) => (formData!.description = html)}
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
        </FormSidebar>
      </div>
    </div>
  </div>
{/if}
