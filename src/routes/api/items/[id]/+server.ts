import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { category, item, itemCategory, itemTag, rarity, tag } from "$lib/server/db/schema"
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

    // Fetch categories
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

    // Fetch rarity
    const rarityData = foundItem.rarityId
      ? await db.select().from(rarity).where(eq(rarity.id, foundItem.rarityId)).limit(1)
      : []

    // Fetch tags
    const tagsData = await db
      .select({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
      })
      .from(itemTag)
      .innerJoin(tag, eq(itemTag.tagId, tag.id))
      .where(eq(itemTag.itemId, foundItem.id))

    const result = {
      ...foundItem,
      categoryIds: categoriesData.map((c) => c.id),
      categories: categoriesData,
      rarity: rarityData[0] ?? null,
      tagIds: tagsData.map((t) => t.id),
      tags: tagsData,
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

    // Handle category associations
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

    // Handle tag associations
    if (tagIds !== undefined) {
      if (Array.isArray(tagIds) && tagIds.length > 0) {
        const tagsExist = await db.select().from(tag).where(inArray(tag.id, tagIds))

        if (tagsExist.length !== tagIds.length) {
          return json({ error: "One or more tags not found" }, { status: 404 })
        }
      }

      // Delete existing tag associations
      await db.delete(itemTag).where(eq(itemTag.itemId, params.id))

      // Insert new tag associations
      if (Array.isArray(tagIds) && tagIds.length > 0) {
        await db.insert(itemTag).values(
          tagIds.map((tId: string) => ({
            itemId: params.id,
            tagId: tId,
          })),
        )
      }
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
    if (rarityId !== undefined) {
      if (rarityId) {
        const [rarityExists] = await db
          .select()
          .from(rarity)
          .where(eq(rarity.id, rarityId))
          .limit(1)
        if (!rarityExists) {
          return json({ error: "Rarity not found" }, { status: 404 })
        }
      }
      updateData.rarityId = rarityId || null
    }
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

    // Fetch categories
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

    // Fetch rarity
    const rarityData = foundItem.rarityId
      ? await db.select().from(rarity).where(eq(rarity.id, foundItem.rarityId)).limit(1)
      : []

    // Fetch tags
    const tagsData = await db
      .select({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
      })
      .from(itemTag)
      .innerJoin(tag, eq(itemTag.tagId, tag.id))
      .where(eq(itemTag.itemId, foundItem.id))

    return json({
      ...foundItem,
      categoryIds: categoriesData.map((c) => c.id),
      categories: categoriesData,
      rarity: rarityData[0] ?? null,
      tagIds: tagsData.map((t) => t.id),
      tags: tagsData,
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
