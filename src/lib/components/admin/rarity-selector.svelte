<script lang="ts">
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
  import { useRarities } from "$lib/queries/rarities"
  import { cn } from "$lib/utils"
  import { Check, ChevronsUpDown, Plus } from "lucide-svelte"
  import { tick } from "svelte"

  type Props = {
    value?: string | null
    onchange: (rarityId: string | null) => void
    label?: string
    placeholder?: string
    class?: string
    required?: boolean
  }

  let {
    value = $bindable(null),
    onchange,
    label = "Rarity",
    placeholder = "Select rarity...",
    class: className,
    required = false,
  }: Props = $props()

  let open = $state(false)

  const raritiesQuery = useRarities(() => 1, 100)

  const rarities = $derived(raritiesQuery.data?.data ?? [])
  const selectedRarity = $derived(rarities.find((r) => r.id === value))

  function selectRarity(rarityId: string | null) {
    value = rarityId
    onchange(rarityId)
    open = false
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
    <Label>
      {label}
      {#if required}<span class="text-destructive">*</span>{/if}
    </Label>
  {/if}

  <Popover {open} onOpenChange={handleOpenChange}>
    <PopoverTrigger
      class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground hover:bg-accent focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {#if selectedRarity}
        <div class="flex items-center gap-2">
          <div
            class="h-3 w-3 rounded-full border"
            style="background-color: {selectedRarity.color}"
          ></div>
          <span>{selectedRarity.name}</span>
        </div>
      {:else}
        <span class="text-muted-foreground">{placeholder}</span>
      {/if}
      <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </PopoverTrigger>

    <PopoverContent class="w-[300px] p-0">
      <Command>
        <CommandInput placeholder="Search rarities..." />
        <CommandList>
          {#if raritiesQuery.isLoading}
            <CommandEmpty>Loading rarities...</CommandEmpty>
          {:else if raritiesQuery.error}
            <CommandEmpty>Error loading rarities</CommandEmpty>
          {:else if rarities.length === 0}
            <CommandEmpty>
              <div class="space-y-2 text-center">
                <p>No rarities found</p>
                <Button href="/admin/rarities/new" variant="outline" size="sm">
                  <Plus class="mr-2 h-4 w-4" />
                  Create Rarity
                </Button>
              </div>
            </CommandEmpty>
          {:else}
            <CommandGroup>
              <CommandItem onSelect={() => selectRarity(null)}>
                <Check class={cn("mr-2 h-4 w-4", !value && "opacity-100", value && "opacity-0")} />
                <span class="text-muted-foreground">No rarity</span>
              </CommandItem>
              {#each rarities as rarity (rarity.id)}
                <CommandItem onSelect={() => selectRarity(rarity.id)}>
                  <Check
                    class={cn(
                      "mr-2 h-4 w-4",
                      value === rarity.id && "opacity-100",
                      value !== rarity.id && "opacity-0",
                    )}
                  />
                  <div class="flex items-center gap-2">
                    <div
                      class="h-3 w-3 rounded-full border"
                      style="background-color: {rarity.color}"
                    ></div>
                    <span>{rarity.name}</span>
                  </div>
                </CommandItem>
              {/each}
            </CommandGroup>

            <div class="border-t p-2">
              <Button href="/admin/rarities/new" variant="outline" size="sm" class="w-full">
                <Plus class="mr-2 h-4 w-4" />
                Create New Rarity
              </Button>
            </div>
          {/if}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>
