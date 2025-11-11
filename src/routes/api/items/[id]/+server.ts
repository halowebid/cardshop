import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { category, item } from "$lib/server/db/schema"
import { eq } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ params }) => {
  try {
    const [foundItem] = await db
      .select({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        setName: item.setName,
        rarity: item.rarity,
        price: item.price,
        imageUrl: item.imageUrl,
        description: item.description,
        stockQty: item.stockQty,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        category: {
          id: category.id,
          title: category.title,
          imageUrl: category.imageUrl,
          description: category.description,
        },
      })
      .from(item)
      .leftJoin(category, eq(item.categoryId, category.id))
      .where(eq(item.id, params.id))
      .limit(1)

    if (!foundItem) {
      return json({ error: "Item not found" }, { status: 404 })
    }

    return json(foundItem)
  } catch (error) {
    console.error("Error fetching item:", error)
    return json({ error: "Failed to fetch item" }, { status: 500 })
  }
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user || session.user.role !== "admin") {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { categoryId, name, setName, rarity, price, imageUrl, description, stockQty } = body

    if (categoryId) {
      const categoryExists = await db
        .select()
        .from(category)
        .where(eq(category.id, categoryId))
        .limit(1)

      if (categoryExists.length === 0) {
        return json({ error: "Category not found" }, { status: 404 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (name !== undefined) updateData.name = name
    if (setName !== undefined) updateData.setName = setName || null
    if (rarity !== undefined) updateData.rarity = rarity || null
    if (price !== undefined) updateData.price = price.toString()
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null
    if (description !== undefined) updateData.description = description || null
    if (stockQty !== undefined) updateData.stockQty = stockQty

    if (Object.keys(updateData).length === 0) {
      return json({ error: "No fields to update" }, { status: 400 })
    }

    const [updatedItem] = await db
      .update(item)
      .set(updateData)
      .where(eq(item.id, params.id))
      .returning()

    if (!updatedItem) {
      return json({ error: "Item not found" }, { status: 404 })
    }

    return json(updatedItem)
  } catch (error) {
    console.error("Error updating item:", error)
    return json({ error: "Failed to update item" }, { status: 500 })
  }
}

export const DELETE: RequestHandler = async ({ params, request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user || session.user.role !== "admin") {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const [deletedItem] = await db.delete(item).where(eq(item.id, params.id)).returning()

    if (!deletedItem) {
      return json({ error: "Item not found" }, { status: 404 })
    }

    return json({ message: "Item deleted successfully" })
  } catch (error) {
    console.error("Error deleting item:", error)
    return json({ error: "Failed to delete item" }, { status: 500 })
  }
}
