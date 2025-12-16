import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query"
import type { PaginatedResponse } from "$lib/types/pagination"

import type { Status } from "./categories"

export type Rarity = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  status: Status
  visibility: boolean
  metaTitle: string | null
  metaDescription: string | null
  imageUrl: string | null
  uploadedImageId: string | null
  createdAt: Date
  updatedAt: Date
  itemCount?: number
}

export const rarityKeys = {
  all: ["rarities"] as const,
  lists: () => [...rarityKeys.all, "list"] as const,
  list: (page?: number, limit?: number, search?: string, status?: string) =>
    [...rarityKeys.lists(), { page, limit, search, status }] as const,
  details: () => [...rarityKeys.all, "detail"] as const,
  detail: (id: string) => [...rarityKeys.details(), id] as const,
}

async function fetchRarities(
  page = 1,
  limit = 20,
  search?: string,
  status?: string,
): Promise<PaginatedResponse<Rarity>> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
  if (search) params.append("search", search)
  if (status) params.append("status", status)
  const res = await fetch(`/api/rarities?${params}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch rarities")
  }
  return res.json()
}

async function fetchRarity(id: string): Promise<Rarity> {
  const res = await fetch(`/api/rarities/${id}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch rarity")
  }
  return res.json()
}

/**
 * Fetches all rarities (admin only)
 * Includes item count for each rarity
 * Supports pagination, search, and status filtering
 */
export function useRarities(
  page: number | (() => number) = 1,
  limit = 20,
  search?: string | (() => string | undefined),
  status?: string | (() => string | undefined),
) {
  return createQuery(() => {
    const currentPage = typeof page === "function" ? page() : page
    const currentSearch = typeof search === "function" ? search() : search
    const currentStatus = typeof status === "function" ? status() : status
    return {
      queryKey: rarityKeys.list(currentPage, limit, currentSearch, currentStatus),
      queryFn: () => fetchRarities(currentPage, limit, currentSearch, currentStatus),
    }
  })
}

/**
 * Fetches a single rarity by ID
 */
export function useRarity(id: string | (() => string)) {
  return createQuery(() => {
    const currentId = typeof id === "function" ? id() : id
    return {
      queryKey: rarityKeys.detail(currentId),
      queryFn: () => fetchRarity(currentId),
      enabled: !!currentId,
    }
  })
}

export type CreateRarityInput = {
  name: string
  slug?: string
  description?: string | null
  color?: string | null
  status?: Status
  visibility?: boolean
  metaTitle?: string
  metaDescription?: string
  imageUrl?: string | null
  uploadedImageId?: string
}

export type UpdateRarityInput = Partial<CreateRarityInput>

async function createRarity(data: CreateRarityInput): Promise<Rarity> {
  const res = await fetch("/api/rarities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to create rarity")
  }
  return res.json()
}

async function updateRarity({
  id,
  data,
}: {
  id: string
  data: UpdateRarityInput
}): Promise<Rarity> {
  const res = await fetch(`/api/rarities/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to update rarity")
  }
  return res.json()
}

async function deleteRarity(id: string): Promise<void> {
  const res = await fetch(`/api/rarities/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to delete rarity")
  }
}

export function useCreateRarity() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: createRarity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rarityKeys.lists() })
    },
  }))
}

export function useUpdateRarity() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: updateRarity,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rarityKeys.lists() })
      queryClient.invalidateQueries({ queryKey: rarityKeys.detail(variables.id) })
    },
  }))
}

export function useDeleteRarity() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: deleteRarity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rarityKeys.lists() })
    },
  }))
}
