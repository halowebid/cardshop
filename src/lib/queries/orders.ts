import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query"
import type { PaginatedResponse } from "$lib/types/pagination"
import { toast } from "svelte-sonner"

export type Order = {
  id: string
  userId: string
  totalPrice: string
  status: string
  createdAt: Date
  updatedAt: Date
  userName: string | null
  userEmail: string | null
  items: OrderItem[]
}

export type OrderItem = {
  id: string
  orderId: string
  itemId: string
  quantity: number
  priceAtTime: string
  itemName: string | null
  itemImageUrl: string | null
}

export type OrderUpdate = {
  status: string
}

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (page?: number, limit?: number) => [...orderKeys.lists(), { page, limit }] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
}

/**
 * Fetches all orders (admin only)
 * Includes user information and order items with item details
 * Refetches every 60 seconds to check for new orders
 */
export function useOrders(page: number | (() => number) = 1, limit = 20) {
  return createQuery(() => {
    const currentPage = typeof page === "function" ? page() : page
    return {
      queryKey: orderKeys.list(currentPage, limit),
      queryFn: async () => {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
        })
        const response = await fetch(`/api/orders?${params.toString()}`, {
          credentials: "include",
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to fetch orders")
        }
        return (await response.json()) as PaginatedResponse<Order>
      },
      refetchInterval: 60000, // Refetch every 60 seconds for new orders
    }
  })
}

/**
 * Fetches a single order by ID
 * Admins can fetch any order, users can only fetch their own
 */
export function useOrder(id: string) {
  return createQuery(() => ({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/orders/${id}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch order")
      }
      const data = (await response.json()) as Order
      return data
    },
    enabled: !!id,
  }))
}

/**
 * Updates an order's status (admin only)
 * Automatically invalidates the orders list cache
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update order status")
      }

      return (await response.json()) as Order
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) })
      toast.success(`Order status updated to ${data.status}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update order status")
    },
  }))
}
