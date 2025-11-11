import { redirect } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { order, orderItem } from "$lib/server/db/schema"
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
      const items = await db.select().from(orderItem).where(eq(orderItem.orderId, o.id))

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
