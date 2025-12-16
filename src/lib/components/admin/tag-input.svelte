<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { cn } from "$lib/utils"
  import { X } from "lucide-svelte"

  type Props = {
    /**
     * Array of tag strings
     */
    value?: string[]
    /**
     * Callback when tags change
     */
    onchange: (tags: string[]) => void
    /**
     * Label text for the field
     */
    label?: string
    /**
     * Placeholder text
     */
    placeholder?: string
    /**
     * Optional CSS classes
     */
    class?: string
  }

  let {
    value = $bindable([]),
    onchange,
    label = "Tags",
    placeholder = "Add tags (comma-separated)",
    class: className,
  }: Props = $props()

  let inputValue = $state("")

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || value?.includes(trimmed)) return

    const newTags = [...(value ?? []), trimmed]
    value = newTags
    onchange(newTags)
  }

  function removeTag(tag: string) {
    const newTags = (value ?? []).filter((t) => t !== tag)
    value = newTags
    onchange(newTags)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      if (inputValue.trim()) {
        const tags = inputValue
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
        tags.forEach(addTag)
        inputValue = ""
      }
    }
  }

  function handleBlur() {
    if (inputValue.trim()) {
      const tags = inputValue
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      tags.forEach(addTag)
      inputValue = ""
    }
  }
</script>

<div class={cn("space-y-2", className)}>
  <Label>{label}</Label>

  {#if value && value.length > 0}
    <div class="flex flex-wrap gap-2">
      {#each value as tag (tag)}
        <Badge variant="secondary" class="flex items-center gap-1">
          {tag}
          <button
            type="button"
            onclick={() => removeTag(tag)}
            class="ml-1 rounded-sm hover:bg-muted"
          >
            <X class="h-3 w-3" />
          </button>
        </Badge>
      {/each}
    </div>
  {/if}

  <Input bind:value={inputValue} {placeholder} onkeydown={handleKeydown} onblur={handleBlur} />
  <p class="text-xs text-muted-foreground">Press Enter or comma to add tags</p>
</div>
