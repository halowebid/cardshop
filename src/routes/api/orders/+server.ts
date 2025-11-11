import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { cartItem, item, order, orderItem } from "$lib/server/db/schema"
import { eq } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const orders = await db
      .select()
      .from(order)
      .where(eq(order.userId, session.user.id))
      .orderBy(order.createdAt)

    return json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const userCartItems = await db
      .select({
        id: cartItem.id,
        itemId: cartItem.itemId,
        quantity: cartItem.quantity,
        item: {
          id: item.id,
          name: item.name,
          price: item.price,
          stockQty: item.stockQty,
        },
      })
      .from(cartItem)
      .leftJoin(item, eq(cartItem.itemId, item.id))
      .where(eq(cartItem.userId, session.user.id))

    if (userCartItems.length === 0) {
      return json({ error: "Cart is empty" }, { status: 400 })
    }

    for (const cartItemData of userCartItems) {
      if (!cartItemData.item) {
        return json({ error: `Item ${cartItemData.itemId} not found` }, { status: 400 })
      }
      if (cartItemData.item.stockQty < cartItemData.quantity) {
        return json(
          { error: `Insufficient stock for item: ${cartItemData.item.name}` },
          { status: 400 },
        )
      }
    }

    const totalPrice = userCartItems.reduce((sum, cartItemData) => {
      const price = parseFloat(cartItemData.item?.price || "0")
      return sum + price * cartItemData.quantity
    }, 0)

    const result = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(order)
        .values({
          userId: session.user.id,
          totalPrice: totalPrice.toFixed(2),
          status: "pending",
        })
        .returning()

      const orderItemsData = userCartItems.map((cartItemData) => ({
        orderId: newOrder.id,
        itemId: cartItemData.itemId,
        quantity: cartItemData.quantity,
        priceAtTime: cartItemData.item!.price,
      }))

      await tx.insert(orderItem).values(orderItemsData)

      for (const cartItemData of userCartItems) {
        await tx
          .update(item)
          .set({ stockQty: cartItemData.item!.stockQty - cartItemData.quantity })
          .where(eq(item.id, cartItemData.itemId))
      }

      await tx.delete(cartItem).where(eq(cartItem.userId, session.user.id))

      return newOrder
    })

    return json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return json({ error: "Failed to create order" }, { status: 500 })
  }
}
