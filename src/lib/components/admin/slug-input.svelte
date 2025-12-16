<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { cn } from "$lib/utils"
  import { slugify } from "$lib/utils/slugify"
  import { toast } from "svelte-sonner"

  type Props = {
    /**
     * Current slug value
     */
    value?: string
    /**
     * Source text to generate slug from (e.g., title or name)
     */
    sourceText?: string
    /**
     * Callback when slug changes
     */
    onchange: (slug: string, isValid: boolean) => void
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
    /**
     * Entity type for slug checking ('item', 'category', 'rarity', or 'tag')
     */
    entityType: "item" | "category" | "rarity" | "tag"
    /**
     * Current entity ID (for updates - exclude from uniqueness check)
     */
    excludeId?: string
  }

  let {
    value = $bindable(""),
    sourceText = "",
    onchange,
    label = "Slug",
    placeholder = "auto-generated-slug",
    class: className,
    entityType,
    excludeId,
  }: Props = $props()

  let manuallyEdited = $state(false)
  let isChecking = $state(false)
  let isAvailable = $state(true)
  let suggestedSlug = $state<string | null>(null)
  let checkTimeout: ReturnType<typeof setTimeout> | null = null

  async function checkSlugAvailability(slug: string) {
    if (!slug) {
      isAvailable = true
      suggestedSlug = null
      return
    }

    isChecking = true

    try {
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const params = new URLSearchParams({ slug })
      if (excludeId) params.append("excludeId", excludeId)

      const endpoint =
        entityType === "item"
          ? "items"
          : entityType === "category"
            ? "categories"
            : entityType === "rarity"
              ? "rarities"
              : "tags"
      const response = await fetch(`/api/${endpoint}/check-slug?${params}`)
      const data = await response.json()

      isAvailable = data.available

      if (!isAvailable) {
        // Fetch suggested available slug
        const suggestion = await generateSuggestedSlug(slug)
        suggestedSlug = suggestion
        toast.error(
          `Slug "${slug}" is already taken. Suggestion: "${suggestion}" or it will be auto-adjusted when saving.`,
        )
      } else {
        suggestedSlug = null
      }

      onchange(slug, isAvailable)
    } catch (error) {
      console.error("Error checking slug:", error)
      isAvailable = true
      suggestedSlug = null
      onchange(slug, true)
    } finally {
      isChecking = false
    }
  }

  async function generateSuggestedSlug(baseSlug: string): Promise<string> {
    const endpoint =
      entityType === "item"
        ? "items"
        : entityType === "category"
          ? "categories"
          : entityType === "rarity"
            ? "rarities"
            : "tags"

    // Try appending numbers until we find an available slug
    for (let i = 2; i <= 10; i++) {
      const candidate = `${baseSlug}-${i}`
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const params = new URLSearchParams({ slug: candidate })
      if (excludeId) params.append("excludeId", excludeId)

      try {
        const response = await fetch(`/api/${endpoint}/check-slug?${params}`)
        const data = await response.json()

        if (data.available) {
          return candidate
        }
      } catch (error) {
        console.error("Error checking slug:", error)
        break
      }
    }

    // Fallback: add timestamp
    return `${baseSlug}-${Date.now()}`
  }

  function useSuggestedSlug() {
    if (suggestedSlug) {
      manuallyEdited = true
      value = suggestedSlug
      checkSlugAvailability(suggestedSlug)
    }
  }

  $effect(() => {
    if (sourceText && !manuallyEdited) {
      const generated = slugify(sourceText)
      value = generated

      // Debounce slug availability check
      if (checkTimeout) clearTimeout(checkTimeout)
      checkTimeout = setTimeout(() => {
        checkSlugAvailability(generated)
      }, 500)
    }
  })

  function handleInput(event: Event) {
    manuallyEdited = true
    const inputValue = (event.target as HTMLInputElement).value
    const slugified = slugify(inputValue)
    value = slugified

    // Debounce slug availability check
    if (checkTimeout) clearTimeout(checkTimeout)
    checkTimeout = setTimeout(() => {
      checkSlugAvailability(slugified)
    }, 500)
  }
</script>

<div class={cn("space-y-2", className)}>
  <Label for="slug-input">{label}</Label>
  <div class="relative">
    <Input
      id="slug-input"
      {value}
      oninput={handleInput}
      {placeholder}
      class={cn(!isAvailable && "border-destructive focus-visible:ring-destructive")}
    />
    {#if isChecking}
      <span class="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
        Checking...
      </span>
    {:else if !isAvailable}
      <span class="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-destructive">
        Already taken
      </span>
    {/if}
  </div>

  {#if !isAvailable && suggestedSlug}
    <div class="flex items-center gap-2 rounded-md border border-muted bg-muted/50 p-2">
      <div class="flex-1">
        <p class="text-xs text-muted-foreground">Suggested available slug:</p>
        <p class="text-sm font-medium text-foreground">{suggestedSlug}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onclick={useSuggestedSlug} class="shrink-0">
        Use this
      </Button>
    </div>
  {/if}

  <p class="text-xs text-muted-foreground">
    URL-friendly identifier (auto-generated from {label === "Slug" ? "title/name" : "source"})
    {#if !isAvailable}
      <span class="text-destructive">- Will be adjusted to a unique value when saving</span>
    {/if}
  </p>
</div>
