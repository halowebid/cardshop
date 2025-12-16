<script lang="ts">
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from "$lib/components/ui/command"
  import { Label } from "$lib/components/ui/label"
  import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover"
  import { useTags } from "$lib/queries/tags"
  import { cn } from "$lib/utils"
  import { Check, ChevronsUpDown, Plus, X } from "lucide-svelte"
  import { tick } from "svelte"

  type Props = {
    value?: string[]
    onchange: (tagIds: string[]) => void
    label?: string
    placeholder?: string
    class?: string
  }

  let {
    value = $bindable([]),
    onchange,
    label = "Tags",
    placeholder = "Select tags...",
    class: className,
  }: Props = $props()

  let open = $state(false)

  const tagsQuery = useTags(() => 1, 100)

  const tags = $derived(tagsQuery.data?.data ?? [])
  const selectedTags = $derived(tags.filter((t) => value.includes(t.id)))

  function toggleTag(tagId: string) {
    const newValue = value.includes(tagId) ? value.filter((id) => id !== tagId) : [...value, tagId]

    value = newValue
    onchange(newValue)
  }

  function removeTag(tagId: string) {
    const newValue = value.filter((id) => id !== tagId)
    value = newValue
    onchange(newValue)
  }

  async function handleOpenChange(isOpen: boolean) {
    open = isOpen
    if (!isOpen) {
      await tick()
    }
  }
</script>

<div class={cn("space-y-2", className)}>
  {#if label}
    <Label>{label}</Label>
  {/if}

  <Popover {open} onOpenChange={handleOpenChange}>
    <PopoverTrigger
      class="flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground hover:bg-accent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div class="flex flex-wrap gap-1">
        {#if selectedTags.length > 0}
          {#each selectedTags as tag (tag.id)}
            <Badge variant="secondary" class="gap-1">
              {tag.name}
              <button
                type="button"
                class="ml-1 rounded-sm hover:bg-secondary-foreground/20"
                onclick={(e) => {
                  e.stopPropagation()
                  removeTag(tag.id)
                }}
              >
                <X class="h-3 w-3" />
              </button>
            </Badge>
          {/each}
        {:else}
          <span class="text-muted-foreground">{placeholder}</span>
        {/if}
      </div>
      <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </PopoverTrigger>

    <PopoverContent class="w-[300px] p-0">
      <Command>
        <CommandInput placeholder="Search tags..." />
        <CommandList>
          {#if tagsQuery.isLoading}
            <CommandEmpty>Loading tags...</CommandEmpty>
          {:else if tagsQuery.error}
            <CommandEmpty>Error loading tags</CommandEmpty>
          {:else if tags.length === 0}
            <CommandEmpty>
              <div class="space-y-2 text-center">
                <p>No tags found</p>
                <Button href="/admin/tags/new" variant="outline" size="sm">
                  <Plus class="mr-2 h-4 w-4" />
                  Create Tag
                </Button>
              </div>
            </CommandEmpty>
          {:else}
            <CommandGroup>
              {#each tags as tag (tag.id)}
                <CommandItem onSelect={() => toggleTag(tag.id)}>
                  <Check
                    class={cn(
                      "mr-2 h-4 w-4",
                      value.includes(tag.id) && "opacity-100",
                      !value.includes(tag.id) && "opacity-0",
                    )}
                  />
                  <span>{tag.name}</span>
                </CommandItem>
              {/each}
            </CommandGroup>

            <div class="border-t p-2">
              <Button href="/admin/tags/new" variant="outline" size="sm" class="w-full">
                <Plus class="mr-2 h-4 w-4" />
                Create New Tag
              </Button>
            </div>
          {/if}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>
