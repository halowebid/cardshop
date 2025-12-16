import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { category, item, itemCategory, itemTag, rarity, tag } from "$lib/server/db/schema"
import { buildPaginationMeta, parsePaginationParams } from "$lib/types/pagination"
import { generateUniqueSlug } from "$lib/utils/slug"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import sanitizeHtml from "sanitize-html"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ url, request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const isAdmin = session?.user?.role === "admin"

    const { page, limit } = parsePaginationParams(url)
    const setName = url.searchParams.get("set")
    const rarityId = url.searchParams.get("rarity_id")
    const categoryId = url.searchParams.get("category_id")

    const conditions = []
    if (setName) conditions.push(eq(item.setName, setName))
    if (rarityId) conditions.push(eq(item.rarityId, rarityId))

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
          rarityId: item.rarityId,
          price: item.price,
          imageUrl: item.imageUrl,
          description: item.description,
          stockQty: item.stockQty,
          status: item.status,
          visibility: item.visibility,
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

    // Fetch categories for items
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

    // Fetch rarity data for items
    const rarityIds = items.map((i) => i.rarityId).filter((id): id is string => id !== null)
    const raritiesData =
      rarityIds.length > 0
        ? await db.select().from(rarity).where(inArray(rarity.id, rarityIds))
        : []
    const rarityMap = new Map(raritiesData.map((r) => [r.id, r]))

    // Fetch tags for items
    const tagsData = await db
      .select({
        itemId: itemTag.itemId,
        tagId: tag.id,
        tagName: tag.name,
        tagSlug: tag.slug,
        tagColor: tag.description,
      })
      .from(itemTag)
      .innerJoin(tag, eq(itemTag.tagId, tag.id))
      .where(inArray(itemTag.itemId, itemIds))

    const tagMap = new Map<string, Array<{ id: string; name: string; slug: string | null }>>()
    for (const row of tagsData) {
      if (!tagMap.has(row.itemId)) {
        tagMap.set(row.itemId, [])
      }
      tagMap.get(row.itemId)!.push({
        id: row.tagId,
        name: row.tagName,
        slug: row.tagSlug,
      })
    }

    const result = items.map((itemData) => ({
      ...itemData,
      categoryIds: categoryMap.get(itemData.id)?.map((c) => c.id) ?? [],
      categories: categoryMap.get(itemData.id) ?? [],
      rarity: itemData.rarityId ? (rarityMap.get(itemData.rarityId) ?? null) : null,
      tags: tagMap.get(itemData.id) ?? [],
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
      rarityId,
      price,
      imageUrl,
      description,
      stockQty,
      slug,
      status,
      visibility,
      tagIds,
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

    // Validate rarity if provided
    if (rarityId) {
      const [rarityExists] = await db.select().from(rarity).where(eq(rarity.id, rarityId)).limit(1)
      if (!rarityExists) {
        return json({ error: "Rarity not found" }, { status: 404 })
      }
    }

    // Validate tags if provided
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      const tagsExist = await db.select().from(tag).where(inArray(tag.id, tagIds))
      if (tagsExist.length !== tagIds.length) {
        return json({ error: "One or more tags not found" }, { status: 404 })
      }
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
        rarityId: rarityId || null,
        price: price.toString(),
        imageUrl: imageUrl || null,
        description: sanitizedDescription,
        stockQty: stockQty !== undefined ? stockQty : 0,
        status: status || "draft",
        visibility: visibility !== undefined ? visibility : false,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        uploadedImageId: uploadedImageId || null,
      })
      .returning()

    // Insert category associations
    await db.insert(itemCategory).values(
      categoryIds.map((catId: string) => ({
        itemId: newItem.id,
        categoryId: catId,
      })),
    )

    // Insert tag associations
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await db.insert(itemTag).values(
        tagIds.map((tId: string) => ({
          itemId: newItem.id,
          tagId: tId,
        })),
      )
    }

    // Fetch rarity data
    const rarityData = newItem.rarityId
      ? await db.select().from(rarity).where(eq(rarity.id, newItem.rarityId)).limit(1)
      : []

    // Fetch tag data
    const tagsData =
      tagIds && tagIds.length > 0 ? await db.select().from(tag).where(inArray(tag.id, tagIds)) : []

    return json(
      {
        ...newItem,
        categoryIds,
        categories: categoriesExist,
        rarity: rarityData[0] ?? null,
        tags: tagsData,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating item:", error)
    return json({ error: "Failed to create item" }, { status: 500 })
  }
}
