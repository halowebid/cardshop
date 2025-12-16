<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import { cn } from "$lib/utils"
  import { ChevronDown, ChevronUp } from "lucide-svelte"

  type Props = {
    /**
     * SEO meta title
     */
    metaTitle?: string
    /**
     * SEO meta description
     */
    metaDescription?: string
    /**
     * Callbacks for changes
     */
    onMetaTitleChange: (value: string) => void
    onMetaDescriptionChange: (value: string) => void
    /**
     * Optional CSS classes
     */
    class?: string
  }

  let {
    metaTitle = $bindable(""),
    metaDescription = $bindable(""),
    onMetaTitleChange,
    onMetaDescriptionChange,
    class: className,
  }: Props = $props()

  let isExpanded = $state(false)
</script>

<div class={cn("space-y-4 rounded-lg border p-4", className)}>
  <Button
    type="button"
    variant="ghost"
    class="flex w-full items-center justify-between p-0 font-semibold"
    onclick={() => (isExpanded = !isExpanded)}
  >
    <span>Search Engine Optimization (SEO)</span>
    {#if isExpanded}
      <ChevronUp class="h-4 w-4" />
    {:else}
      <ChevronDown class="h-4 w-4" />
    {/if}
  </Button>

  {#if isExpanded}
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="meta-title">Meta Title</Label>
        <Input
          id="meta-title"
          bind:value={metaTitle}
          oninput={(e) => onMetaTitleChange((e.target as HTMLInputElement).value)}
          placeholder="Custom title for search engines"
        />
        <p class="text-xs text-muted-foreground">
          {metaTitle?.length ?? 0}/60 characters (optimal: 50-60)
        </p>
      </div>

      <div class="space-y-2">
        <Label for="meta-description">Meta Description</Label>
        <Textarea
          id="meta-description"
          bind:value={metaDescription}
          oninput={(e) => onMetaDescriptionChange((e.target as HTMLTextAreaElement).value)}
          placeholder="Custom description for search engines"
          rows={3}
        />
        <p class="text-xs text-muted-foreground">
          {metaDescription?.length ?? 0}/160 characters (optimal: 120-160)
        </p>
      </div>
    </div>
  {/if}
</div>
