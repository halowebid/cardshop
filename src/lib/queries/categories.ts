import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query"

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
  list: () => [...categoryKeys.lists()] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories")
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

export function useCategories() {
  return createQuery(() => ({
    queryKey: categoryKeys.list(),
    queryFn: fetchCategories,
  }))
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
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() })
    },
  }))
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: updateCategory,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) })
    },
  }))
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() })
    },
  }))
}
