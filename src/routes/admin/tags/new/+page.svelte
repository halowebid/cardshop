<script lang="ts">
  import Loader2Icon from "@lucide/svelte/icons/loader-circle"
  import { goto } from "$app/navigation"
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
  import { useCreateTag, type CreateTagInput } from "$lib/queries/tags"
  import { toast } from "svelte-sonner"

  let formData = $state<CreateTagInput>({
    name: "",
    slug: "",
    description: null,
    status: "draft",
    visibility: false,
    metaTitle: "",
    metaDescription: "",
  })

  const createMutation = useCreateTag()

  let unsavedChanges = $state(false)

  function handleSubmit(publishImmediately = false) {
    if (!formData.name.trim()) {
      toast.error("Tag name is required")
      return
    }

    const data: CreateTagInput = {
      ...formData,
      status: publishImmediately ? "active" : formData.status,
      visibility: publishImmediately ? true : formData.visibility,
    }

    createMutation.mutate(data, {
      onSuccess: () => {
        unsavedChanges = false
        goto("/admin/tags")
      },
    })
  }

  function handleCancel() {
    if (unsavedChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to leave?")) {
        return
      }
    }
    goto("/admin/tags")
  }

  $effect(() => {
    if (formData.name || formData.description) {
      unsavedChanges = true
    }
  })
</script>

<svelte:head>
  <title>New Tag - Admin</title>
</svelte:head>

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
        <BreadcrumbPage>New Tag</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>

  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold">Create New Tag</h1>
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
              placeholder="e.g., Holo, First Edition, PSA Graded"
              required
            />
          </div>

          <SlugInput
            bind:value={formData.slug}
            sourceText={formData.name}
            entityType="tag"
            onchange={(slug) => (formData.slug = slug)}
          />
        </div>
      </div>

      <div class="rounded-lg border bg-card p-6">
        <h2 class="mb-4 text-xl font-semibold">Description</h2>
        <RichTextEditor
          bind:value={formData.description}
          onchange={(html) => (formData.description = html)}
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
