import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { item, order, orderItem } from "$lib/server/db/schema"
import { and, eq } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ params, request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = session.user.role === "admin"

    const whereCondition = isAdmin
      ? eq(order.id, params.id)
      : and(eq(order.id, params.id), eq(order.userId, session.user.id))

    const [foundOrder] = await db.select().from(order).where(whereCondition).limit(1)

    if (!foundOrder) {
      return json({ error: "Order not found" }, { status: 404 })
    }

    const items = await db
      .select({
        id: orderItem.id,
        orderId: orderItem.orderId,
        itemId: orderItem.itemId,
        quantity: orderItem.quantity,
        priceAtTime: orderItem.priceAtTime,
        item: {
          id: item.id,
          name: item.name,
          setName: item.setName,
          rarity: item.rarity,
          imageUrl: item.imageUrl,
        },
      })
      .from(orderItem)
      .leftJoin(item, eq(orderItem.itemId, item.id))
      .where(eq(orderItem.orderId, params.id))

    return json({
      ...foundOrder,
      items,
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    return json({ error: "Failed to fetch order" }, { status: 500 })
  }
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user || session.user.role !== "admin") {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return json({ error: "status is required" }, { status: 400 })
    }

    const [updatedOrder] = await db
      .update(order)
      .set({ status })
      .where(eq(order.id, params.id))
      .returning()

    if (!updatedOrder) {
      return json({ error: "Order not found" }, { status: 404 })
    }

    return json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return json({ error: "Failed to update order" }, { status: 500 })
  }
}
