<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Label } from "$lib/components/ui/label"
  import { cn } from "$lib/utils"
  import { Loader2, Upload, X } from "lucide-svelte"
  import { toast } from "svelte-sonner"

  type Props = {
    /**
     * Current image URL (if any)
     */
    value?: string | null
    /**
     * Callback when image is uploaded or removed
     */
    onchange: (url: string | undefined, fileId: string | undefined) => void
    /**
     * Label text for the upload field
     */
    label?: string
    /**
     * Optional CSS classes
     */
    class?: string
  }

  let { value = $bindable(), onchange, label = "Image", class: className }: Props = $props()

  let uploading = $state(false)
  let fileInput: HTMLInputElement

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed")
      return
    }

    uploading = true

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const { url, fileId } = await response.json()
      value = url
      onchange(url, fileId)
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      uploading = false
      input.value = ""
    }
  }

  function handleRemove() {
    value = undefined
    onchange(undefined, undefined)
    toast.success("Image removed")
  }
</script>

<div class={cn("space-y-2", className)}>
  <Label>{label}</Label>

  {#if value}
    <div class="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-muted">
      <img src={value} alt="Uploaded preview" class="h-full w-full object-cover" />
      <Button
        variant="destructive"
        size="icon"
        class="absolute top-2 right-2"
        onclick={handleRemove}
        disabled={uploading}
      >
        <X class="h-4 w-4" />
      </Button>
    </div>
  {:else}
    <button
      type="button"
      class="flex aspect-video w-full max-w-md flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
      onclick={() => fileInput.click()}
      disabled={uploading}
    >
      {#if uploading}
        <Loader2 class="h-10 w-10 animate-spin text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Uploading...</p>
      {:else}
        <Upload class="h-10 w-10 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Click to upload image</p>
        <p class="text-xs text-muted-foreground/75">PNG, JPG, WEBP, GIF up to 5MB</p>
      {/if}
    </button>
  {/if}

  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    class="hidden"
    onchange={handleFileSelect}
    disabled={uploading}
  />
</div>
