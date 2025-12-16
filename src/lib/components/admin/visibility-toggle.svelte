<script lang="ts">
  import { Label } from "$lib/components/ui/label"
  import { Switch } from "$lib/components/ui/switch"
  import { cn } from "$lib/utils"
  import { Eye, EyeOff } from "lucide-svelte"

  type Props = {
    /**
     * Visibility state (true = visible, false = hidden)
     */
    value?: boolean
    /**
     * Callback when visibility changes
     */
    onchange: (visible: boolean) => void
    /**
     * Label text for the field
     */
    label?: string
    /**
     * Optional CSS classes
     */
    class?: string
  }

  let {
    value = $bindable(false),
    onchange,
    label = "Visibility",
    class: className,
  }: Props = $props()

  function handleChange(checked: boolean) {
    value = checked
    onchange(checked)
  }
</script>

<div class={cn("flex items-center justify-between space-x-2", className)}>
  <Label for="visibility-toggle" class="flex items-center gap-2">
    {#if value}
      <Eye class="h-4 w-4" />
    {:else}
      <EyeOff class="h-4 w-4" />
    {/if}
    {label}
  </Label>
  <Switch id="visibility-toggle" checked={value} onCheckedChange={handleChange} />
</div>
