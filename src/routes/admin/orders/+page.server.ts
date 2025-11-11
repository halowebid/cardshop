import { error } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { item, order, orderItem, user } from "$lib/server/db/schema"
import { desc, eq } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async () => {
  try {
    const orders = await db
      .select({
        id: order.id,
        userId: order.userId,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(order)
      .leftJoin(user, eq(order.userId, user.id))
      .orderBy(desc(order.createdAt))

    const ordersWithItems = await Promise.all(
      orders.map(async (o) => {
        const items = await db
          .select({
            id: orderItem.id,
            orderId: orderItem.orderId,
            itemId: orderItem.itemId,
            quantity: orderItem.quantity,
            priceAtTime: orderItem.priceAtTime,
            itemName: item.name,
            itemImageUrl: item.imageUrl,
          })
          .from(orderItem)
          .leftJoin(item, eq(orderItem.itemId, item.id))
          .where(eq(orderItem.orderId, o.id))

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
