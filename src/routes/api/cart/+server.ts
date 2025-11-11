import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { cartItem, item } from "$lib/server/db/schema"
import { and, eq } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return json({ error: "Unauthorized - use localStorage for anonymous carts" }, { status: 401 })
    }

    const items = await db
      .select({
        id: cartItem.id,
        itemId: cartItem.itemId,
        quantity: cartItem.quantity,
        createdAt: cartItem.createdAt,
        item: {
          id: item.id,
          name: item.name,
          setName: item.setName,
          rarity: item.rarity,
          price: item.price,
          imageUrl: item.imageUrl,
          stockQty: item.stockQty,
        },
      })
      .from(cartItem)
      .leftJoin(item, eq(cartItem.itemId, item.id))
      .where(eq(cartItem.userId, session.user.id))

    return json(items)
  } catch (error) {
    console.error("Error fetching cart:", error)
    return json({ error: "Failed to fetch cart" }, { status: 500 })
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return json({ error: "Unauthorized - use localStorage for anonymous carts" }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, quantity } = body

    if (!itemId || quantity === undefined || quantity < 1) {
      return json({ error: "itemId and quantity (min 1) are required" }, { status: 400 })
    }

    const [itemExists] = await db.select().from(item).where(eq(item.id, itemId)).limit(1)

    if (!itemExists) {
      return json({ error: "Item not found" }, { status: 404 })
    }

    if (itemExists.stockQty < quantity) {
      return json({ error: "Insufficient stock" }, { status: 400 })
    }

    const [existingCartItem] = await db
      .select()
      .from(cartItem)
      .where(and(eq(cartItem.userId, session.user.id), eq(cartItem.itemId, itemId)))
      .limit(1)

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity

      if (itemExists.stockQty < newQuantity) {
        return json({ error: "Insufficient stock for updated quantity" }, { status: 400 })
      }

      const [updatedCartItem] = await db
        .update(cartItem)
        .set({ quantity: newQuantity })
        .where(eq(cartItem.id, existingCartItem.id))
        .returning()

      return json(updatedCartItem)
    }

    const [newCartItem] = await db
      .insert(cartItem)
      .values({
        userId: session.user.id,
        itemId,
        quantity,
      })
      .returning()

    return json(newCartItem, { status: 201 })
  } catch (error) {
    console.error("Error adding to cart:", error)
    return json({ error: "Failed to add to cart" }, { status: 500 })
  }
}

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.delete(cartItem).where(eq(cartItem.userId, session.user.id))

    return json({ message: "Cart cleared successfully" })
  } catch (error) {
    console.error("Error clearing cart:", error)
    return json({ error: "Failed to clear cart" }, { status: 500 })
  }
}
