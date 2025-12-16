<script lang="ts">
  import { Label } from "$lib/components/ui/label"
  import type { Status } from "$lib/queries/categories"
  import { cn } from "$lib/utils"

  type Props = {
    /**
     * Current status value
     */
    value?: Status
    /**
     * Callback when status changes
     */
    onchange: (status: Status) => void
    /**
     * Label text for the field
     */
    label?: string
    /**
     * Optional CSS classes
     */
    class?: string
  }

  let { value = $bindable("draft"), onchange, label = "Status", class: className }: Props = $props()

  function handleChange(event: Event) {
    const status = (event.target as HTMLSelectElement).value as Status
    value = status
    onchange(status)
  }
</script>

<div class={cn("space-y-2", className)}>
  <Label for="status-select">{label}</Label>
  <select
    id="status-select"
    {value}
    onchange={handleChange}
    class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
  >
    <option value="draft">Draft</option>
    <option value="active">Active</option>
    <option value="archived">Archived</option>
  </select>
</div>
