import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { cartItem, item } from "$lib/server/db/schema"
import { and, eq } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { quantity } = body

    if (quantity === undefined || quantity < 1) {
      return json({ error: "quantity (min 1) is required" }, { status: 400 })
    }

    const [existingCartItem] = await db
      .select({
        id: cartItem.id,
        userId: cartItem.userId,
        itemId: cartItem.itemId,
        quantity: cartItem.quantity,
        item: {
          stockQty: item.stockQty,
        },
      })
      .from(cartItem)
      .leftJoin(item, eq(cartItem.itemId, item.id))
      .where(and(eq(cartItem.id, params.id), eq(cartItem.userId, session.user.id)))
      .limit(1)

    if (!existingCartItem) {
      return json({ error: "Cart item not found" }, { status: 404 })
    }

    if (!existingCartItem.item?.stockQty || existingCartItem.item.stockQty < quantity) {
      return json({ error: "Insufficient stock" }, { status: 400 })
    }

    const [updatedCartItem] = await db
      .update(cartItem)
      .set({ quantity })
      .where(eq(cartItem.id, params.id))
      .returning()

    return json(updatedCartItem)
  } catch (error) {
    console.error("Error updating cart item:", error)
    return json({ error: "Failed to update cart item" }, { status: 500 })
  }
}

export const DELETE: RequestHandler = async ({ params, request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const [deletedCartItem] = await db
      .delete(cartItem)
      .where(and(eq(cartItem.id, params.id), eq(cartItem.userId, session.user.id)))
      .returning()

    if (!deletedCartItem) {
      return json({ error: "Cart item not found" }, { status: 404 })
    }

    return json({ message: "Cart item removed successfully" })
  } catch (error) {
    console.error("Error deleting cart item:", error)
    return json({ error: "Failed to delete cart item" }, { status: 500 })
  }
}
