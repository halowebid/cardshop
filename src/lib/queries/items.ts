import {
  createInfiniteQuery,
  createMutation,
  createQuery,
  useQueryClient,
} from "@tanstack/svelte-query"
import type { PaginatedResponse } from "$lib/types/pagination"
import { toast } from "svelte-sonner"

import type { Status } from "./categories"

export type Item = {
  id: string
  categoryIds: string[]
  name: string
  slug: string | null
  setName: string | null
  rarityId: string | null
  price: string
  imageUrl: string | null
  description: string | null
  stockQty: number
  status: Status
  visibility: boolean
  metaTitle: string | null
  metaDescription: string | null
  uploadedImageId: string | null
  createdAt: Date
  updatedAt: Date
  categories?: Array<{
    id: string
    title: string
    slug: string
    imageUrl: string | null
    description?: string | null
  }>
  rarity?: {
    id: string
    name: string
    slug: string | null
    color: string | null
    description: string | null
  } | null
  tagIds?: string[]
  tags?: Array<{
    id: string
    name: string
    slug: string | null
    description: string | null
  }>
}

export type ItemInsert = {
  categoryIds: string[]
  name: string
  slug?: string
  setName?: string | null
  rarityId?: string | null
  price: string | number
  imageUrl?: string | null
  description?: string | null
  stockQty?: number
  status?: Status
  visibility?: boolean
  tagIds?: string[]
  metaTitle?: string
  metaDescription?: string
  uploadedImageId?: string
}

export type ItemFilters = {
  set?: string
  rarity_id?: string
  category_id?: string
}

export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  list: (filters?: ItemFilters, page?: number, limit?: number) =>
    [...itemKeys.lists(), filters ?? {}, { page, limit }] as const,
  infinite: (filters?: ItemFilters) => [...itemKeys.all, "infinite", filters ?? {}] as const,
  details: () => [...itemKeys.all, "detail"] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
}

async function fetchItemsPaginated(
  filters: ItemFilters | undefined,
  page: number,
  limit: number,
): Promise<PaginatedResponse<Item>> {
  const params = new URLSearchParams()
  params.set("page", page.toString())
  params.set("limit", limit.toString())
  if (filters?.set) params.set("set", filters.set)
  if (filters?.rarity_id) params.set("rarity_id", filters.rarity_id)
  if (filters?.category_id) params.set("category_id", filters.category_id)

  const url = `/api/items?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch items")
  }
  return res.json()
}

async function fetchItems(filters?: ItemFilters): Promise<Item[]> {
  const params = new URLSearchParams()
  if (filters?.set) params.set("set", filters.set)
  if (filters?.rarity_id) params.set("rarity_id", filters.rarity_id)
  if (filters?.category_id) params.set("category_id", filters.category_id)

  const url = `/api/items${params.toString() ? `?${params.toString()}` : ""}`
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch items")
  }
  const response = (await res.json()) as PaginatedResponse<Item>
  return response.data
}

async function fetchItem(id: string): Promise<Item> {
  const res = await fetch(`/api/items/${id}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch item")
  }
  return res.json()
}

async function createItem(data: ItemInsert): Promise<Item> {
  const res = await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to create item")
  }
  return res.json()
}

async function updateItem(id: string, data: Partial<ItemInsert>): Promise<Item> {
  const res = await fetch(`/api/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to update item")
  }
  return res.json()
}

async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`/api/items/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to delete item")
  }
}

export function useItems(filters?: ItemFilters) {
  return createQuery(() => ({
    queryKey: itemKeys.list(filters),
    queryFn: () => fetchItems(filters),
  }))
}

export function useItemsPaginated(
  page: number | (() => number) = 1,
  limit = 20,
  filters?: ItemFilters,
) {
  return createQuery(() => {
    const currentPage = typeof page === "function" ? page() : page
    return {
      queryKey: itemKeys.list(filters, currentPage, limit),
      queryFn: () => fetchItemsPaginated(filters, currentPage, limit),
    }
  })
}

/**
 * Infinite query hook for public pages
 * Loads 20 items per page with infinite scroll
 * Accepts a getter function for filters to enable reactivity in Svelte 5
 */
export function useItemsInfinite(filtersGetter?: () => ItemFilters | undefined) {
  return createInfiniteQuery(() => {
    const filters = filtersGetter?.()
    return {
      queryKey: itemKeys.infinite(filters),
      queryFn: ({ pageParam }) => fetchItemsPaginated(filters, pageParam, 20),
      getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
      initialPageParam: 1,
    }
  })
}

export function useItem(id: string) {
  return createQuery(() => ({
    queryKey: itemKeys.detail(id),
    queryFn: () => fetchItem(id),
    enabled: !!id,
  }))
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
      toast.success("Item created successfully")
    },
    onError: (error: Error) => {
      toast.error(`Failed to create item: ${error.message}`)
    },
  }))
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: string; data: Partial<ItemInsert> }) => updateItem(id, data),
    onSuccess: (updatedItem: Item) => {
      queryClient.setQueryData(itemKeys.detail(updatedItem.id), updatedItem)
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
      toast.success("Item updated successfully")
    },
    onError: (error: Error) => {
      toast.error(`Failed to update item: ${error.message}`)
    },
  }))
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
      toast.success("Item deleted successfully")
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete item: ${error.message}`)
    },
  }))
}
