import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { cartItem, item } from "$lib/server/db/schema"
import { eq, inArray } from "drizzle-orm"

import type { RequestHandler } from "./$types"

type LocalCartItem = {
  itemId: string
  quantity: number
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { items: localItems } = body as { items: LocalCartItem[] }

    if (!Array.isArray(localItems) || localItems.length === 0) {
      return json({ message: "No items to migrate" })
    }

    const itemIds = localItems.map((i) => i.itemId)
    const existingItems = await db.select().from(item).where(inArray(item.id, itemIds))

    const existingItemMap = new Map(existingItems.map((i) => [i.id, i]))

    const validLocalItems = localItems.filter((localItem) => {
      const itemData = existingItemMap.get(localItem.itemId)
      return itemData && itemData.stockQty >= localItem.quantity && localItem.quantity > 0
    })

    if (validLocalItems.length === 0) {
      return json({ message: "No valid items to migrate" })
    }

    const existingCartItems = await db
      .select()
      .from(cartItem)
      .where(eq(cartItem.userId, session.user.id))

    const existingCartMap = new Map(existingCartItems.map((ci) => [ci.itemId, ci]))

    const itemsToInsert: Array<{ userId: string; itemId: string; quantity: number }> = []
    const itemsToUpdate: Array<{ id: string; quantity: number }> = []

    for (const localItem of validLocalItems) {
      const existingCart = existingCartMap.get(localItem.itemId)
      const itemData = existingItemMap.get(localItem.itemId)

      if (!itemData) continue

      if (existingCart) {
        const newQuantity = Math.min(existingCart.quantity + localItem.quantity, itemData.stockQty)
        if (newQuantity !== existingCart.quantity) {
          itemsToUpdate.push({ id: existingCart.id, quantity: newQuantity })
        }
      } else {
        itemsToInsert.push({
          userId: session.user.id,
          itemId: localItem.itemId,
          quantity: Math.min(localItem.quantity, itemData.stockQty),
        })
      }
    }

    if (itemsToInsert.length > 0) {
      await db.insert(cartItem).values(itemsToInsert)
    }

    for (const update of itemsToUpdate) {
      await db.update(cartItem).set({ quantity: update.quantity }).where(eq(cartItem.id, update.id))
    }

    return json({
      message: "Cart migrated successfully",
      inserted: itemsToInsert.length,
      updated: itemsToUpdate.length,
    })
  } catch (error) {
    console.error("Error migrating cart:", error)
    return json({ error: "Failed to migrate cart" }, { status: 500 })
  }
}
