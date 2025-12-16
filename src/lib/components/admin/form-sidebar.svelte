<script lang="ts">
  import { cn } from "$lib/utils"

  type Props = {
    /**
     * Optional CSS classes
     */
    class?: string
    /**
     * Children elements
     */
    children: import("svelte").Snippet
  }

  let { class: className, children }: Props = $props()
</script>

<aside class={cn("space-y-6 rounded-lg border bg-muted/30 p-6", className)}>
  {@render children()}
</aside>
