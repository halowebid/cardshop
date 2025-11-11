import { redirect } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { item, order, orderItem } from "$lib/server/db/schema"
import { desc, eq } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ request }) => {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    throw redirect(303, "/auth/sign-in")
  }

  const orders = await db
    .select()
    .from(order)
    .where(eq(order.userId, session.user.id))
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
}
