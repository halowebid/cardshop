<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-circle"
  import { goto } from "$app/navigation"
  import FormSidebar from "$lib/components/admin/form-sidebar.svelte"
  import ImageUpload from "$lib/components/admin/image-upload.svelte"
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
  import { useCreateRarity, type CreateRarityInput } from "$lib/queries/rarities"
  import { toast } from "svelte-sonner"

  let formData = $state<CreateRarityInput>({
    name: "",
    slug: "",
    description: null,
    color: "#9CA3AF",
    imageUrl: null,
    uploadedImageId: "",
    status: "draft",
    visibility: false,
    metaTitle: "",
    metaDescription: "",
  })

  const createMutation = useCreateRarity()

  let unsavedChanges = $state(false)

  function handleSubmit(publishImmediately = false) {
    if (!formData.name.trim()) {
      toast.error("Rarity name is required")
      return
    }

    const data: CreateRarityInput = {
      ...formData,
      status: publishImmediately ? "active" : formData.status,
      visibility: publishImmediately ? true : formData.visibility,
    }

    createMutation.mutate(data, {
      onSuccess: () => {
        unsavedChanges = false
        goto("/admin/rarities")
      },
    })
  }

  function handleCancel() {
    if (unsavedChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to leave?")) {
        return
      }
    }
    goto("/admin/rarities")
  }

  $effect(() => {
    if (formData.name || formData.description) {
      unsavedChanges = true
    }
  })
</script>

<svelte:head>
  <title>New Rarity - Admin</title>
</svelte:head>

<div class="container mx-auto py-6">
  <Breadcrumb class="mb-6">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="/admin/rarities">Rarities</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>New Rarity</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>

  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold">Create New Rarity</h1>
    <div class="flex gap-2">
      <Button variant="outline" onclick={handleCancel} disabled={createMutation.isPending}>
        Cancel
      </Button>
      <Button
        variant="secondary"
        onclick={() => handleSubmit(false)}
        disabled={createMutation.isPending}
      >
        {#if createMutation.isPending}
          <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
        {/if}
        Save as Draft
      </Button>
      <Button onclick={() => handleSubmit(true)} disabled={createMutation.isPending}>
        {#if createMutation.isPending}
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
              bind:value={formData.name}
              placeholder="e.g., Common, Rare, Mythic"
              required
            />
          </div>

          <SlugInput
            bind:value={formData.slug}
            sourceText={formData.name}
            entityType="rarity"
            onchange={(slug) => (formData.slug = slug)}
          />

          <div class="space-y-2">
            <Label for="color">Color</Label>
            <div class="flex items-center gap-3">
              <Input
                id="color"
                type="color"
                bind:value={formData.color}
                class="h-10 w-20 cursor-pointer"
              />
              <Input
                type="text"
                bind:value={formData.color}
                placeholder="#9CA3AF"
                pattern="^#[0-9A-Fa-f]{6}$"
                class="flex-1 font-mono"
              />
              <div
                class="h-10 w-10 rounded border"
                style="background-color: {formData.color}"
              ></div>
            </div>
            <p class="text-sm text-muted-foreground">
              Choose a color to represent this rarity level
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg border bg-card p-6">
        <h2 class="mb-4 text-xl font-semibold">Description</h2>
        <RichTextEditor
          bind:value={formData.description}
          onchange={(html) => (formData.description = html)}
        />
      </div>

      <div class="rounded-lg border bg-card p-6">
        <h2 class="mb-4 text-xl font-semibold">Image</h2>
        <ImageUpload
          bind:value={formData.imageUrl}
          onchange={(url, fileId) => {
            formData.imageUrl = url ?? null
            formData.uploadedImageId = fileId ?? ""
          }}
        />
      </div>

      <SeoFields
        bind:metaTitle={formData.metaTitle}
        bind:metaDescription={formData.metaDescription}
        onMetaTitleChange={(value) => (formData.metaTitle = value)}
        onMetaDescriptionChange={(value) => (formData.metaDescription = value)}
      />
    </div>

    <div class="lg:col-span-1">
      <FormSidebar>
        <StatusSelector
          bind:value={formData.status}
          onchange={(status) => (formData.status = status)}
        />

        <Separator />

        <VisibilityToggle
          bind:value={formData.visibility}
          onchange={(visible) => (formData.visibility = visible)}
        />
      </FormSidebar>
    </div>
  </div>
</div>
