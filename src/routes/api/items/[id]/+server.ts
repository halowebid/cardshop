import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { category, item, itemCategory } from "$lib/server/db/schema"
import { generateUniqueSlug, isUUID } from "$lib/utils/slug"
import { eq, inArray } from "drizzle-orm"
import sanitizeHtml from "sanitize-html"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ params }) => {
  try {
    const idOrSlug = params.id
    const isId = isUUID(idOrSlug)

    const [foundItem] = await db
      .select()
      .from(item)
      .where(isId ? eq(item.id, idOrSlug) : eq(item.slug, idOrSlug))
      .limit(1)

    if (!foundItem) {
      return json({ error: "Item not found" }, { status: 404 })
    }

    const categoriesData = await db
      .select({
        id: category.id,
        title: category.title,
        imageUrl: category.imageUrl,
        description: category.description,
      })
      .from(itemCategory)
      .innerJoin(category, eq(itemCategory.categoryId, category.id))
      .where(eq(itemCategory.itemId, foundItem.id))

    const result = {
      ...foundItem,
      categoryIds: categoriesData.map((c) => c.id),
      categories: categoriesData,
    }

    return json(result)
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

    if (categoryIds !== undefined) {
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return json({ error: "categoryIds must be a non-empty array" }, { status: 400 })
      }

      const categoriesExist = await db
        .select()
        .from(category)
        .where(inArray(category.id, categoryIds))

      if (categoriesExist.length !== categoryIds.length) {
        return json({ error: "One or more categories not found" }, { status: 404 })
      }

      await db.delete(itemCategory).where(eq(itemCategory.itemId, params.id))

      await db.insert(itemCategory).values(
        categoryIds.map((catId: string) => ({
          itemId: params.id,
          categoryId: catId,
        })),
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) {
      if (slug.trim() === "") {
        return json({ error: "Slug cannot be empty" }, { status: 400 })
      }
      const existingSlug = await db.select().from(item).where(eq(item.slug, slug)).limit(1)
      if (existingSlug.length > 0 && existingSlug[0].id !== params.id) {
        updateData.slug = await generateUniqueSlug(slug, "item", params.id)
      } else {
        updateData.slug = slug
      }
    }
    if (setName !== undefined) updateData.setName = setName || null
    if (rarity !== undefined) updateData.rarity = rarity || null
    if (price !== undefined) updateData.price = price.toString()
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null
    if (description !== undefined) {
      updateData.description = description
        ? sanitizeHtml(description, {
            allowedTags: ["p", "br", "strong", "em", "a", "ul", "ol", "li", "h2", "h3"],
            allowedAttributes: {
              a: ["href", "target", "rel"],
            },
          })
        : null
    }
    if (stockQty !== undefined) updateData.stockQty = stockQty
    if (status !== undefined) updateData.status = status
    if (visibility !== undefined) updateData.visibility = visibility
    if (tags !== undefined) updateData.tags = tags || null
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle || null
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription || null
    if (uploadedImageId !== undefined) updateData.uploadedImageId = uploadedImageId || null

    if (Object.keys(updateData).length > 0) {
      const [updatedItem] = await db
        .update(item)
        .set(updateData)
        .where(eq(item.id, params.id))
        .returning()

      if (!updatedItem) {
        return json({ error: "Item not found" }, { status: 404 })
      }
    }

    const [foundItem] = await db.select().from(item).where(eq(item.id, params.id)).limit(1)

    if (!foundItem) {
      return json({ error: "Item not found" }, { status: 404 })
    }

    const categoriesData = await db
      .select({
        id: category.id,
        title: category.title,
        imageUrl: category.imageUrl,
        description: category.description,
      })
      .from(itemCategory)
      .innerJoin(category, eq(itemCategory.categoryId, category.id))
      .where(eq(itemCategory.itemId, foundItem.id))

    return json({
      ...foundItem,
      categoryIds: categoriesData.map((c) => c.id),
      categories: categoriesData,
    })
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
