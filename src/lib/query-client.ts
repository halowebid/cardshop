import { QueryClient } from "@tanstack/svelte-query"
import { browser } from "$app/environment"

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Client-side only caching
        staleTime: 1000 * 30, // 30 seconds
        gcTime: 1000 * 60 * 5, // 5 minutes cache
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        // Admin pages: enabled by default
        // Can be overridden per query
        enabled: browser,
      },
      mutations: {
        retry: 1,
        onError: (error) => {
          console.error("Mutation error:", error)
        },
      },
    },
  })
}
