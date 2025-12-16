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
  import { useCategories } from "$lib/queries/categories"
  import { cn } from "$lib/utils"
  import { Check, ChevronsUpDown, Plus, X } from "lucide-svelte"
  import { tick } from "svelte"

  type Props = {
    value?: string[]
    onchange: (categoryIds: string[]) => void
    label?: string
    placeholder?: string
    class?: string
  }

  let {
    value = $bindable([]),
    onchange,
    label = "Categories",
    placeholder = "Select categories...",
    class: className,
  }: Props = $props()

  let open = $state(false)

  const categoriesQuery = useCategories()

  const categories = $derived(categoriesQuery.data?.data ?? [])
  const selectedCategories = $derived(categories.filter((c) => value.includes(c.id)))

  function toggleCategory(categoryId: string) {
    const newValue = value.includes(categoryId)
      ? value.filter((id) => id !== categoryId)
      : [...value, categoryId]

    value = newValue
    onchange(newValue)
  }

  function removeCategory(categoryId: string) {
    const newValue = value.filter((id) => id !== categoryId)
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
        {#if selectedCategories.length > 0}
          {#each selectedCategories as category (category.id)}
            <Badge variant="secondary" class="gap-1">
              {category.title}
              <button
                type="button"
                class="ml-1 rounded-sm hover:bg-secondary-foreground/20"
                onclick={(e) => {
                  e.stopPropagation()
                  removeCategory(category.id)
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
        <CommandInput placeholder="Search categories..." />
        <CommandList>
          {#if categoriesQuery.isLoading}
            <CommandEmpty>Loading categories...</CommandEmpty>
          {:else if categoriesQuery.error}
            <CommandEmpty>Error loading categories</CommandEmpty>
          {:else if categories.length === 0}
            <CommandEmpty>
              <div class="space-y-2 text-center">
                <p>No categories found</p>
                <Button href="/admin/categories/new" variant="outline" size="sm">
                  <Plus class="mr-2 h-4 w-4" />
                  Create Category
                </Button>
              </div>
            </CommandEmpty>
          {:else}
            <CommandGroup>
              {#each categories as category (category.id)}
                <CommandItem onSelect={() => toggleCategory(category.id)}>
                  <Check
                    class={cn(
                      "mr-2 h-4 w-4",
                      value.includes(category.id) && "opacity-100",
                      !value.includes(category.id) && "opacity-0",
                    )}
                  />
                  <span>{category.title}</span>
                </CommandItem>
              {/each}
            </CommandGroup>

            <div class="border-t p-2">
              <Button href="/admin/categories/new" variant="outline" size="sm" class="w-full">
                <Plus class="mr-2 h-4 w-4" />
                Create New Category
              </Button>
            </div>
          {/if}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>
