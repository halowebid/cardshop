import { createQuery } from "@tanstack/svelte-query"

// Types for dashboard statistics
export type DashboardStats = {
  totalCategories: number
  totalItems: number
  totalOrders: number
  lowStockItems: number
  outOfStockItems: number
  totalRevenue: number
  pendingOrders: number
}

export type RecentOrder = {
  id: string
  totalPrice: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export type DashboardData = {
  stats: DashboardStats
  recentOrders: RecentOrder[]
}

// Query Keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
}

// Fetch Functions
async function fetchDashboardStats(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard")
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch dashboard statistics")
  }
  return res.json()
}

// Query Hooks

/**
 * Fetches dashboard statistics with 30s refetch interval
 * Includes total counts, revenue, stock alerts, and recent orders
 */
export function useDashboardStats() {
  return createQuery(() => ({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  }))
}
