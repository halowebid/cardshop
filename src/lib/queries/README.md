# TanStack Query Guide

This directory contains query hooks and utilities for data fetching using TanStack Query in the
CardShop application.

## Query Key Conventions

Query keys follow a hierarchical structure to enable precise cache invalidation:

```typescript
// Pattern: ['resource', 'operation', ...parameters]

// List queries
;["items", "list"][("items", "list", { category: "electronics", search: "phone" })][
  // Detail queries
  ("items", "detail", 42)
][("orders", "detail", 123)][
  // Stats/aggregates
  ("admin", "stats", "dashboard")
]
```

### Key Structure Best Practices

1. **Start with resource name** (items, orders, categories, cart)
2. **Add operation type** (list, detail, stats)
3. **Include filters/params** as objects for lists
4. **Include IDs** for detail queries

This structure allows:

- Invalidate all items: `queryClient.invalidateQueries({ queryKey: ['items'] })`
- Invalidate item lists: `queryClient.invalidateQueries({ queryKey: ['items', 'list'] })`
- Invalidate specific item: `queryClient.invalidateQueries({ queryKey: ['items', 'detail', 42] })`

## File Organization

Each resource has its own query file:

- `items.ts` - Item catalog queries and mutations
- `categories.ts` - Category management
- `orders.ts` - Order listing and updates
- `cart.ts` - Shopping cart with optimistic updates
- `dashboard.ts` - Admin dashboard stats
- `inventory.ts` - Inventory management

## Creating Query Hooks

### Basic Query Pattern

```typescript
import { createQuery, useQueryClient } from "@tanstack/svelte-query"

// 1. Define query keys (hierarchical, type-safe)
export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  list: (filters: string) => [...itemKeys.lists(), { filters }] as const,
  details: () => [...itemKeys.all, "detail"] as const,
  detail: (id: number) => [...itemKeys.details(), id] as const,
}

// 2. Create fetch function
async function fetchItems(): Promise<Item[]> {
  const res = await fetch("/api/items")
  if (!res.ok) throw new Error("Failed to fetch items")
  return res.json()
}

// 3. Export query hook
export function useItems() {
  return createQuery({
    queryKey: itemKeys.lists(),
    queryFn: fetchItems,
  })
}
```

### Using in Components

```svelte
<script lang="ts">
  import { useItems } from "$lib/queries/items"

  const itemsQuery = useItems()

  // Access reactive state with $derived
  const items = $derived($itemsQuery.data ?? [])
  const isLoading = $derived($itemsQuery.isLoading)
  const error = $derived($itemsQuery.error)
</script>

{#if isLoading}
  <div>Loading...</div>
{:else if error}
  <div>Error: {error.message}</div>
{:else}
  <div>
    {#each items as item}
      <div>{item.name}</div>
    {/each}
  </div>
{/if}
```

## Creating Mutation Hooks

### Basic Mutation Pattern

```typescript
import { createMutation, useQueryClient } from "@tanstack/svelte-query"
import { toast } from "svelte-sonner"

async function createItem(data: ItemInsert): Promise<Item> {
  const res = await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create item")
  return res.json()
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return createMutation({
    mutationFn: createItem,
    onSuccess: () => {
      // Invalidate to trigger refetch
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
      toast.success("Item created successfully")
    },
    onError: (error) => {
      toast.error(`Failed to create item: ${error.message}`)
    },
  })
}
```

### Using Mutations in Components

```svelte
<script lang="ts">
  import { useCreateItem } from "$lib/queries/items"

  const createMutation = useCreateItem()

  function handleCreate() {
    $createMutation.mutate({
      name: "New Item",
      price: 0,
    })
  }
</script>

<button onclick={handleCreate} disabled={$createMutation.isPending}>
  {$createMutation.isPending ? "Creating..." : "Create Item"}
</button>
```

## Optimistic Updates

For instant UI feedback (e.g., cart operations):

```typescript
export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return createMutation({
    mutationFn: updateCartItem,

    // Before mutation runs
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: cartKeys.all })

      // Snapshot previous value for rollback
      const previousCart = queryClient.getQueryData(cartKeys.detail())

      // Optimistically update cache
      queryClient.setQueryData(cartKeys.detail(), (old: Cart) => ({
        ...old,
        items: old.items.map((item) =>
          item.id === variables.id ? { ...item, quantity: variables.quantity } : item,
        ),
      }))

      // Return context for rollback
      return { previousCart }
    },

    // If mutation fails, rollback
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.detail(), context.previousCart)
      }
      toast.error("Failed to update cart")
    },

    // Always refetch to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}
```

## Background Refetching

For real-time data (dashboard, orders):

```typescript
export function useDashboardStats() {
  return createQuery({
    queryKey: ["admin", "stats", "dashboard"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  })
}
```

## Configuration Options

### Query Options

- `staleTime` - How long data is considered fresh (default: 30s)
- `gcTime` - How long unused data stays in cache (default: 5min)
- `enabled` - Conditionally enable/disable query (e.g., `enabled: !!id`)
- `refetchInterval` - Auto-refetch interval (e.g., 30000 for 30s)
- `refetchOnWindowFocus` - Refetch when window regains focus (default: true)
- `refetchOnReconnect` - Refetch when network reconnects (default: true)

### Mutation Options

- `onMutate` - Before mutation (for optimistic updates)
- `onSuccess` - After successful mutation
- `onError` - After failed mutation
- `onSettled` - Always runs after mutation (success or error)

## Admin Pages Pattern

Admin pages use **client-side only** queries (no SSR):

1. Remove `+page.server.ts` files
2. Use query hooks directly in components
3. Data fetches on client after authentication

```svelte
<!-- src/routes/admin/items/+page.svelte -->
<script lang="ts">
  import { useCreateItem, useDeleteItem, useItems, useUpdateItem } from "$lib/queries/items"

  // All queries run client-side
  const itemsQuery = useItems()
  const createMutation = useCreateItem()
  const updateMutation = useUpdateItem()
  const deleteMutation = useDeleteItem()

  const items = $derived($itemsQuery.data ?? [])
</script>
```

## Public Pages Pattern

Public pages **keep SSR** for SEO (not migrated to TanStack Query):

```typescript
// src/routes/items/[id]/+page.server.ts - Keep as-is
export const load: PageServerLoad = async ({ params, fetch }) => {
  const itemId = parseInt(params.id)
  const res = await fetch(`/api/items/${itemId}`)
  const item = await res.json()
  return { item }
}
```

TanStack Query is used for:

- ✅ Admin pages (authenticated, no SEO)
- ✅ Shopping cart (client-side state)
- ❌ Public item/category pages (keep SSR)

## Devtools

The TanStack Query devtools are available in development mode:

1. Look for the floating button in bottom-right corner
2. Click to open devtools panel
3. Inspect active queries, cache state, and timing
4. Test offline scenarios and refetch behavior

Devtools features:

- **Query Inspector** - See all queries and their status
- **Mutation Inspector** - Track mutation lifecycle
- **Query Timeline** - Visualize fetch/refetch events
- **Cache Explorer** - Browse cached data

## Error Handling

Errors are handled at multiple levels:

1. **Automatic retry** - Failed requests retry with exponential backoff (3 attempts)
2. **Query-level** - Handle in component with `error` state
3. **Mutation callbacks** - Use `onError` to show toast notifications
4. **Global handler** - Configure in `query-client.ts`

```typescript
// Don't retry on client errors (4xx)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 3
      },
    },
  },
})
```

## Performance Tips

1. **Use query keys wisely** - Hierarchical keys enable precise invalidation
2. **Set appropriate staleTime** - Balance freshness vs. unnecessary fetches
3. **Implement optimistic updates** - For instant UX on mutations
4. **Use refetchInterval sparingly** - Only for real-time data (dashboard, orders)
5. **Prefetch on hover** - For predictable navigation
6. **Paginate large lists** - Use infinite queries for better performance

## Testing

Use TanStack Query's testing utilities:

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query"
import { render } from "@testing-library/svelte"

// Create test query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

// Wrap component with provider
const { container } = render(MyComponent, {
  context: new Map([[QueryClientProvider, queryClient]]),
})
```

## Troubleshooting

### Query not refetching

- Check `staleTime` - data might still be fresh
- Check `enabled` option - query might be disabled
- Use devtools to inspect query state

### Cache not updating after mutation

- Verify you're invalidating correct query keys
- Use hierarchical keys for precise invalidation
- Check devtools to see which queries are active

### Hydration warnings

- Ensure queries are client-side only for admin pages
- Keep SSR for public pages (don't migrate them)
- Check `enabled: browser` in query options

### Performance issues

- Review refetch intervals - polling too frequently?
- Check cache size - too much data being cached?
- Use devtools to identify slow queries
- Consider pagination for large lists
