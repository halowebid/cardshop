import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { cartItem, item } from "$lib/server/db/schema"
import { eq, inArray } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ request, url }) => {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  // For authenticated users, fetch from database
  if (session?.user) {
    const cartItems = await db
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
          categoryId: item.categoryId,
        },
      })
      .from(cartItem)
      .leftJoin(item, eq(cartItem.itemId, item.id))
      .where(eq(cartItem.userId, session.user.id))

    return {
      cartItems,
      isAuthenticated: true,
    }
  }

  // For anonymous users, fetch items from query params (client will pass localStorage data)
  const cartParam = url.searchParams.get("cart")
  if (!cartParam) {
    return {
      cartItems: [],
      isAuthenticated: false,
    }
  }

  try {
    const localCart = JSON.parse(cartParam) as Array<{ itemId: string; quantity: number }>
    const itemIds = localCart.map((i) => i.itemId)

    if (itemIds.length === 0) {
      return {
        cartItems: [],
        isAuthenticated: false,
      }
    }

    const items = await db.select().from(item).where(inArray(item.id, itemIds))

    const cartItems = localCart
      .map((localItem) => {
        const itemData = items.find((i) => i.id === localItem.itemId)
        if (!itemData) return null

        return {
          id: localItem.itemId, // For anonymous, use itemId as id
          itemId: localItem.itemId,
          quantity: localItem.quantity,
          createdAt: new Date(),
          item: itemData,
        }
      })
      .filter((i) => i !== null)

    return {
      cartItems,
      isAuthenticated: false,
    }
  } catch {
    return {
      cartItems: [],
      isAuthenticated: false,
    }
  }
}
