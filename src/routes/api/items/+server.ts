import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { category, item, itemCategory } from "$lib/server/db/schema"
import { and, eq, inArray, sql } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ url }) => {
  try {
    const setName = url.searchParams.get("set")
    const rarity = url.searchParams.get("rarity")
    const categoryId = url.searchParams.get("category_id")

    const conditions = []
    if (setName) conditions.push(eq(item.setName, setName))
    if (rarity) conditions.push(eq(item.rarity, rarity))

    let items

    if (categoryId) {
      const itemsWithCategory = await db
        .select({
          id: item.id,
          name: item.name,
          setName: item.setName,
          rarity: item.rarity,
          price: item.price,
          imageUrl: item.imageUrl,
          description: item.description,
          stockQty: item.stockQty,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })
        .from(item)
        .innerJoin(itemCategory, eq(item.id, itemCategory.itemId))
        .where(
          conditions.length > 0
            ? and(eq(itemCategory.categoryId, categoryId), ...conditions)
            : eq(itemCategory.categoryId, categoryId),
        )
        .orderBy(item.createdAt)

      items = itemsWithCategory
    } else {
      const itemsQuery =
        conditions.length > 0
          ? db
              .select()
              .from(item)
              .where(and(...conditions))
              .orderBy(item.createdAt)
          : db.select().from(item).orderBy(item.createdAt)

      items = await itemsQuery
    }

    const itemIds = items.map((itemData) => itemData.id)

    if (itemIds.length === 0) {
      return json([])
    }

    const categoriesData = await db
      .select({
        itemId: itemCategory.itemId,
        categoryId: category.id,
        categoryTitle: category.title,
        categoryImageUrl: category.imageUrl,
      })
      .from(itemCategory)
      .innerJoin(category, eq(itemCategory.categoryId, category.id))
      .where(inArray(itemCategory.itemId, itemIds))

    const categoryMap = new Map<
      string,
      Array<{ id: string; title: string; imageUrl: string | null }>
    >()
    for (const row of categoriesData) {
      if (!categoryMap.has(row.itemId)) {
        categoryMap.set(row.itemId, [])
      }
      categoryMap.get(row.itemId)!.push({
        id: row.categoryId,
        title: row.categoryTitle,
        imageUrl: row.categoryImageUrl,
      })
    }

    const result = items.map((itemData) => ({
      ...itemData,
      categoryIds: categoryMap.get(itemData.id)?.map((c) => c.id) ?? [],
      categories: categoryMap.get(itemData.id) ?? [],
    }))

    return json(result)
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
    const { categoryIds, name, setName, rarity, price, imageUrl, description, stockQty } = body

    if (
      !categoryIds ||
      !Array.isArray(categoryIds) ||
      categoryIds.length === 0 ||
      !name ||
      price === undefined
    ) {
      return json(
        { error: "categoryIds (non-empty array), name, and price are required" },
        { status: 400 },
      )
    }

    const categoriesExist = await db
      .select()
      .from(category)
      .where(inArray(category.id, categoryIds))

    if (categoriesExist.length !== categoryIds.length) {
      return json({ error: "One or more categories not found" }, { status: 404 })
    }

    const [newItem] = await db
      .insert(item)
      .values({
        name,
        setName: setName || null,
        rarity: rarity || null,
        price: price.toString(),
        imageUrl: imageUrl || null,
        description: description || null,
        stockQty: stockQty !== undefined ? stockQty : 0,
      })
      .returning()

    await db.insert(itemCategory).values(
      categoryIds.map((catId: string) => ({
        itemId: newItem.id,
        categoryId: catId,
      })),
    )

    return json({ ...newItem, categoryIds, categories: categoriesExist }, { status: 201 })
  } catch (error) {
    console.error("Error creating item:", error)
    return json({ error: "Failed to create item" }, { status: 500 })
  }
}
