import { redirect } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { cartItem, item } from "$lib/server/db/schema"
import { eq } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ request }) => {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    throw redirect(303, "/auth/sign-in")
  }

  const cartItems = await db
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

  if (cartItems.length === 0) {
    throw redirect(303, "/cart")
  }

  return {
    cartItems,
    user: session.user,
  }
}
