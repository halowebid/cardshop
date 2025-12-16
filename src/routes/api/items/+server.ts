import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { category, item, itemCategory } from "$lib/server/db/schema"
import {
  buildPaginationMeta,
  parsePaginationParams,
  type PaginatedResponse,
} from "$lib/types/pagination"
import { generateUniqueSlug } from "$lib/utils/slug"
import { and, count, desc, eq, inArray, sql } from "drizzle-orm"
import sanitizeHtml from "sanitize-html"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ url, request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const isAdmin = session?.user?.role === "admin"

    const { page, limit } = parsePaginationParams(url)
    const setName = url.searchParams.get("set")
    const rarity = url.searchParams.get("rarity")
    const categoryId = url.searchParams.get("category_id")

    const conditions = []
    if (setName) conditions.push(eq(item.setName, setName))
    if (rarity) conditions.push(eq(item.rarity, rarity))

    // Filter by status and visibility for non-admin users
    if (!isAdmin) {
      conditions.push(eq(item.status, "active"))
      conditions.push(eq(item.visibility, true))
    }

    let items
    let total = 0

    if (categoryId) {
      // Count total items with category filter
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(item)
        .innerJoin(itemCategory, eq(item.id, itemCategory.itemId))
        .where(
          conditions.length > 0
            ? and(eq(itemCategory.categoryId, categoryId), ...conditions)
            : eq(itemCategory.categoryId, categoryId),
        )
      const [countResult] = await countQuery
      total = Number(countResult.count)

      // Fetch paginated items
      const itemsWithCategory = await db
        .select({
          id: item.id,
          name: item.name,
          slug: item.slug,
          setName: item.setName,
          rarity: item.rarity,
          price: item.price,
          imageUrl: item.imageUrl,
          description: item.description,
          stockQty: item.stockQty,
          status: item.status,
          visibility: item.visibility,
          tags: item.tags,
          metaTitle: item.metaTitle,
          metaDescription: item.metaDescription,
          uploadedImageId: item.uploadedImageId,
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
        .orderBy(desc(item.updatedAt))
        .limit(limit)
        .offset((page - 1) * limit)

      items = itemsWithCategory
    } else {
      // Count total items
      const countQuery =
        conditions.length > 0
          ? db
              .select({ count: sql<number>`count(*)` })
              .from(item)
              .where(and(...conditions))
          : db.select({ count: sql<number>`count(*)` }).from(item)
      const [countResult] = await countQuery
      total = Number(countResult.count)

      // Fetch paginated items
      const itemsQuery =
        conditions.length > 0
          ? db
              .select()
              .from(item)
              .where(and(...conditions))
              .orderBy(desc(item.updatedAt))
              .limit(limit)
              .offset((page - 1) * limit)
          : db
              .select()
              .from(item)
              .orderBy(desc(item.updatedAt))
              .limit(limit)
              .offset((page - 1) * limit)

      items = await itemsQuery
    }

    const itemIds = items.map((itemData) => itemData.id)

    if (itemIds.length === 0) {
      const meta = buildPaginationMeta(page, limit, total)
      return json({ data: [], meta })
    }

    const categoriesData = await db
      .select({
        itemId: itemCategory.itemId,
        categoryId: category.id,
        categoryTitle: category.title,
        categorySlug: category.slug,
        categoryImageUrl: category.imageUrl,
      })
      .from(itemCategory)
      .innerJoin(category, eq(itemCategory.categoryId, category.id))
      .where(inArray(itemCategory.itemId, itemIds))

    const categoryMap = new Map<
      string,
      Array<{ id: string; title: string; slug: string; imageUrl: string | null }>
    >()
    for (const row of categoriesData) {
      if (!categoryMap.has(row.itemId)) {
        categoryMap.set(row.itemId, [])
      }
      categoryMap.get(row.itemId)!.push({
        id: row.categoryId,
        title: row.categoryTitle,
        slug: row.categorySlug,
        imageUrl: row.categoryImageUrl,
      })
    }

    const result = items.map((itemData) => ({
      ...itemData,
      categoryIds: categoryMap.get(itemData.id)?.map((c) => c.id) ?? [],
      categories: categoryMap.get(itemData.id) ?? [],
    }))

    const meta = buildPaginationMeta(page, limit, total)

    return json({ data: result, meta })
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
    const {
      categoryIds,
      name,
      setName,
      rarity,
      price,
      imageUrl,
      description,
      stockQty,
      slug,
      status,
      visibility,
      tags,
      metaTitle,
      metaDescription,
      uploadedImageId,
    } = body

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

    const itemSlug = slug || (await generateUniqueSlug(name, "item"))

    // Sanitize HTML description if provided
    const sanitizedDescription = description
      ? sanitizeHtml(description, {
          allowedTags: ["p", "br", "strong", "em", "a", "ul", "ol", "li", "h2", "h3"],
          allowedAttributes: {
            a: ["href", "target", "rel"],
          },
        })
      : null

    const [newItem] = await db
      .insert(item)
      .values({
        name,
        slug: itemSlug,
        setName: setName || null,
        rarity: rarity || null,
        price: price.toString(),
        imageUrl: imageUrl || null,
        description: sanitizedDescription,
        stockQty: stockQty !== undefined ? stockQty : 0,
        status: status || "draft",
        visibility: visibility !== undefined ? visibility : false,
        tags: tags || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        uploadedImageId: uploadedImageId || null,
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
