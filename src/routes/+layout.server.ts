import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { cartItem } from "$lib/server/db/schema"
import { eq, sum } from "drizzle-orm"

import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async (event) => {
  const session = await auth.api.getSession({
    headers: event.request.headers,
  })

  let cartCount = 0

  // If user is authenticated, get cart count from database
  if (session?.user) {
    try {
      const result = await db
        .select({ total: sum(cartItem.quantity) })
        .from(cartItem)
        .where(eq(cartItem.userId, session.user.id))

      cartCount = result[0]?.total ? Number(result[0].total) : 0
    } catch (error) {
      console.error("Failed to fetch cart count:", error)
    }
  }

  return {
    user: session?.user ?? null,
    cartCount,
  }
}
