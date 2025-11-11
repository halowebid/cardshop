import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { category, item } from "$lib/server/db/schema"
import { and, eq } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ url }) => {
  try {
    const setName = url.searchParams.get("set")
    const rarity = url.searchParams.get("rarity")
    const categoryId = url.searchParams.get("category_id")

    let query = db
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
        },
      })
      .from(item)
      .leftJoin(category, eq(item.categoryId, category.id))

    const conditions = []
    if (setName) conditions.push(eq(item.setName, setName))
    if (rarity) conditions.push(eq(item.rarity, rarity))
    if (categoryId) conditions.push(eq(item.categoryId, categoryId))

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }

    const items = await query.orderBy(item.createdAt)

    return json(items)
  } catch (error) {
    console.error("Error fetching items:", error)
    return json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user || session.user.role !== "admin") {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { categoryId, name, setName, rarity, price, imageUrl, description, stockQty } = body

    if (!categoryId || !name || price === undefined) {
      return json({ error: "categoryId, name, and price are required" }, { status: 400 })
    }

    const categoryExists = await db
      .select()
      .from(category)
      .where(eq(category.id, categoryId))
      .limit(1)

    if (categoryExists.length === 0) {
      return json({ error: "Category not found" }, { status: 404 })
    }

    const [newItem] = await db
      .insert(item)
      .values({
        categoryId,
        name,
        setName: setName || null,
        rarity: rarity || null,
        price: price.toString(),
        imageUrl: imageUrl || null,
        description: description || null,
        stockQty: stockQty !== undefined ? stockQty : 0,
      })
      .returning()

    return json(newItem, { status: 201 })
  } catch (error) {
    console.error("Error creating item:", error)
    return json({ error: "Failed to create item" }, { status: 500 })
  }
}
