import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query"
import type { PaginatedResponse } from "$lib/types/pagination"

import type { Status } from "./categories"

export type Tag = {
  id: string
  name: string
  slug: string
  description: string | null
  status: Status
  visibility: boolean
  metaTitle: string | null
  metaDescription: string | null
  createdAt: Date
  updatedAt: Date
  itemCount?: number
}

export const tagKeys = {
  all: ["tags"] as const,
  lists: () => [...tagKeys.all, "list"] as const,
  list: (page?: number, limit?: number, search?: string, status?: string) =>
    [...tagKeys.lists(), { page, limit, search, status }] as const,
  details: () => [...tagKeys.all, "detail"] as const,
  detail: (id: string) => [...tagKeys.details(), id] as const,
}

async function fetchTags(
  page = 1,
  limit = 20,
  search?: string,
  status?: string,
): Promise<PaginatedResponse<Tag>> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
  if (search) params.append("search", search)
  if (status) params.append("status", status)
  const res = await fetch(`/api/tags?${params}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch tags")
  }
  return res.json()
}

async function fetchTag(id: string): Promise<Tag> {
  const res = await fetch(`/api/tags/${id}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch tag")
  }
  return res.json()
}

/**
 * Fetches all tags (admin only)
 * Includes item count for each tag
 * Supports pagination, search, and status filtering
 */
export function useTags(
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
      queryKey: tagKeys.list(currentPage, limit, currentSearch, currentStatus),
      queryFn: () => fetchTags(currentPage, limit, currentSearch, currentStatus),
    }
  })
}

/**
 * Fetches a single tag by ID
 */
export function useTag(id: string | (() => string)) {
  return createQuery(() => {
    const currentId = typeof id === "function" ? id() : id
    return {
      queryKey: tagKeys.detail(currentId),
      queryFn: () => fetchTag(currentId),
      enabled: !!currentId,
    }
  })
}

export type CreateTagInput = {
  name: string
  slug?: string
  description?: string | null
  status?: Status
  visibility?: boolean
  metaTitle?: string
  metaDescription?: string
}

export type UpdateTagInput = Partial<CreateTagInput>

async function createTag(data: CreateTagInput): Promise<Tag> {
  const res = await fetch("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to create tag")
  }
  return res.json()
}

async function updateTag({ id, data }: { id: string; data: UpdateTagInput }): Promise<Tag> {
  const res = await fetch(`/api/tags/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to update tag")
  }
  return res.json()
}

async function deleteTag(id: string): Promise<void> {
  const res = await fetch(`/api/tags/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to delete tag")
  }
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
    },
  }))
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: updateTag,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(variables.id) })
    },
  }))
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
    },
  }))
}
