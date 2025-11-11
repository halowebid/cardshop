import { error } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { order, orderItem } from "$lib/server/db/schema"
import { desc, eq } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async () => {
  try {
    const orders = await db.select().from(order).orderBy(desc(order.createdAt))

    const ordersWithItems = await Promise.all(
      orders.map(async (o) => {
        const items = await db.select().from(orderItem).where(eq(orderItem.orderId, o.id))

        return {
          ...o,
          items,
        }
      }),
    )

    return {
      orders: ordersWithItems,
    }
  } catch (err) {
    console.error("Failed to load orders:", err)
    throw error(500, "Failed to load orders. Please try again later.")
  }
}
