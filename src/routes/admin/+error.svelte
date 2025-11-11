<script lang="ts">
  import AlertCircleIcon from "@lucide/svelte/icons/alert-circle"
  import HomeIcon from "@lucide/svelte/icons/home"
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw"
  import { page } from "$app/stores"
  import { Button } from "$lib/components/ui/button"
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card"

  function reload() {
    window.location.reload()
  }
</script>

<div class="flex min-h-screen items-center justify-center p-4">
  <Card class="w-full max-w-md">
    <CardHeader class="text-center">
      <div class="mb-4 flex justify-center">
        <AlertCircleIcon class="h-12 w-12 text-destructive" />
      </div>
      <CardTitle class="text-2xl">Something went wrong</CardTitle>
      <CardDescription>
        {$page.error?.message || "An unexpected error occurred"}
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="rounded-lg bg-muted p-4">
        <p class="text-sm text-muted-foreground">
          Status: <span class="font-mono font-medium">{$page.status}</span>
        </p>
      </div>
      <div class="text-sm text-muted-foreground">
        <p>This error has been logged. If the problem persists, please contact support.</p>
      </div>
    </CardContent>
    <CardFooter class="flex gap-2">
      <Button variant="outline" class="flex-1" onclick={reload}>
        <RefreshCwIcon class="mr-2 h-4 w-4" />
        Try Again
      </Button>
      <a href="/admin" class="flex-1">
        <Button class="w-full">
          <HomeIcon class="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </a>
    </CardFooter>
  </Card>
</div>
