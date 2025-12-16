import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query"
import type { PaginatedResponse } from "$lib/types/pagination"

export type Category = {
  id: string
  title: string
  slug: string | null
  imageUrl: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
  itemCount?: number
}

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (page?: number, limit?: number) => [...categoryKeys.lists(), { page, limit }] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}

async function fetchCategories(page = 1, limit = 20): Promise<PaginatedResponse<Category>> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
  const res = await fetch(`/api/categories?${params}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch categories")
  }
  return res.json()
}

async function fetchCategory(id: string): Promise<Category> {
  const res = await fetch(`/api/categories/${id}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch category")
  }
  return res.json()
}

export function useCategories(page: number | (() => number) = 1, limit = 20) {
  return createQuery(() => {
    const currentPage = typeof page === "function" ? page() : page
    return {
      queryKey: categoryKeys.list(currentPage, limit),
      queryFn: () => fetchCategories(currentPage, limit),
    }
  })
}

export function useCategory(id: string) {
  return createQuery(() => ({
    queryKey: categoryKeys.detail(id),
    queryFn: () => fetchCategory(id),
    enabled: !!id,
  }))
}

export type CreateCategoryInput = {
  title: string
  slug?: string
  imageUrl?: string | null
  description?: string | null
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>

async function createCategory(data: CreateCategoryInput): Promise<Category> {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to create category")
  }
  return res.json()
}

async function updateCategory({
  id,
  data,
}: {
  id: string
  data: UpdateCategoryInput
}): Promise<Category> {
  const res = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to update category")
  }
  return res.json()
}

async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to delete category")
  }
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  }))
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: updateCategory,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) })
    },
  }))
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  }))
}
