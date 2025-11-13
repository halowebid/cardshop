import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query"
import { toast } from "svelte-sonner"

export type Item = {
  id: string
  categoryIds: string[]
  name: string
  setName: string | null
  rarity: string | null
  price: string
  imageUrl: string | null
  description: string | null
  stockQty: number
  createdAt: Date
  updatedAt: Date
  categories?: Array<{
    id: string
    title: string
    imageUrl: string | null
    description?: string | null
  }>
}

export type ItemInsert = {
  categoryIds: string[]
  name: string
  setName?: string | null
  rarity?: string | null
  price: string | number
  imageUrl?: string | null
  description?: string | null
  stockQty?: number
}

export type ItemFilters = {
  set?: string
  rarity?: string
  category_id?: string
}

export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  list: (filters?: ItemFilters) => [...itemKeys.lists(), filters ?? {}] as const,
  details: () => [...itemKeys.all, "detail"] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
}

async function fetchItems(filters?: ItemFilters): Promise<Item[]> {
  const params = new URLSearchParams()
  if (filters?.set) params.set("set", filters.set)
  if (filters?.rarity) params.set("rarity", filters.rarity)
  if (filters?.category_id) params.set("category_id", filters.category_id)

  const url = `/api/items${params.toString() ? `?${params.toString()}` : ""}`
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch items")
  }
  return res.json()
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
