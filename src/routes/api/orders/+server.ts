import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { cartItem, item, order, orderItem, user } from "$lib/server/db/schema"
import { buildPaginationMeta, parsePaginationParams } from "$lib/types/pagination"
import { desc, eq, inArray, sql } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const { page, limit } = parsePaginationParams(url)
    const isAdmin = session.user.role === "admin"

    if (isAdmin) {
      // Admin: fetch all orders with user and item details
      const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(order)
      const total = Number(countResult.count)

      const orders = await db
        .select({
          id: order.id,
          userId: order.userId,
          totalPrice: order.totalPrice,
          status: order.status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          userName: user.name,
          userEmail: user.email,
        })
        .from(order)
        .leftJoin(user, eq(order.userId, user.id))
        .orderBy(desc(order.updatedAt))
        .limit(limit)
        .offset((page - 1) * limit)

      const orderIds = orders.map((o) => o.id)
      if (orderIds.length === 0) {
        const meta = buildPaginationMeta(page, limit, total)
        return json({ data: [], meta })
      }

      const orderItemsData = await db
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
        .where(inArray(orderItem.orderId, orderIds))

      const itemsByOrder = new Map<string, typeof orderItemsData>()
      for (const oi of orderItemsData) {
        if (!itemsByOrder.has(oi.orderId)) {
          itemsByOrder.set(oi.orderId, [])
        }
        itemsByOrder.get(oi.orderId)!.push(oi)
      }

      const result = orders.map((o) => ({
        ...o,
        items: itemsByOrder.get(o.id) || [],
      }))

      const meta = buildPaginationMeta(page, limit, total)
      return json({ data: result, meta })
    } else {
      // Regular user: fetch only their orders
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(order)
        .where(eq(order.userId, session.user.id))
      const total = Number(countResult.count)

      const orders = await db
        .select()
        .from(order)
        .where(eq(order.userId, session.user.id))
        .orderBy(desc(order.updatedAt))
        .limit(limit)
        .offset((page - 1) * limit)

      const meta = buildPaginationMeta(page, limit, total)
      return json({ data: orders, meta })
    }
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
