import { json } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { category, item, order } from "$lib/server/db/schema"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async () => {
  try {
    const [categories, items, orders] = await Promise.all([
      db.select().from(category),
      db.select().from(item),
      db.select().from(order),
    ])

    // Calculate statistics
    const totalCategories = categories.length
    const totalItems = items.length
    const totalOrders = orders.length
    const lowStockItems = items.filter((i) => i.stockQty < 10 && i.stockQty > 0).length
    const outOfStockItems = items.filter((i) => i.stockQty === 0).length

    const totalRevenue = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + parseFloat(o.totalPrice), 0)

    const pendingOrders = orders.filter((o) => o.status === "pending").length

    // Recent orders (last 5)
    const recentOrders = orders.slice(0, 5)

    return json({
      stats: {
        totalCategories,
        totalItems,
        totalOrders,
        lowStockItems,
        outOfStockItems,
        totalRevenue,
        pendingOrders,
      },
      recentOrders,
    })
  } catch (err) {
    console.error("Failed to load dashboard data:", err)
    return json({ error: "Failed to load dashboard data" }, { status: 500 })
  }
}
