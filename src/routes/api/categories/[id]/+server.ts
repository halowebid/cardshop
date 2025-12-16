import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { category, itemCategory } from "$lib/server/db/schema"
import { generateUniqueSlug, isUUID } from "$lib/utils/slug"
import { eq, sql } from "drizzle-orm"
import sanitizeHtml from "sanitize-html"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ params }) => {
  try {
    const identifier = params.id
    const isId = isUUID(identifier)

    const [categoryData] = await db
      .select({
        id: category.id,
        title: category.title,
        slug: category.slug,
        imageUrl: category.imageUrl,
        description: category.description,
        status: category.status,
        visibility: category.visibility,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        uploadedImageId: category.uploadedImageId,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        itemCount: sql<number>`cast(count(${itemCategory.itemId}) as integer)`,
      })
      .from(category)
      .leftJoin(itemCategory, eq(itemCategory.categoryId, category.id))
      .where(isId ? eq(category.id, identifier) : eq(category.slug, identifier))
      .groupBy(category.id)

    if (!categoryData) {
      return json({ error: "Category not found" }, { status: 404 })
    }

    return json(categoryData)
  } catch (error) {
    console.error("Error fetching category:", error)
    return json({ error: "Failed to fetch category" }, { status: 500 })
  }
}

export const PATCH: RequestHandler = async ({ request, params }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user || session.user.role !== "admin") {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      slug: providedSlug,
      imageUrl,
      description,
      status,
      visibility,
      metaTitle,
      metaDescription,
      uploadedImageId,
    } = body

    if (title) {
      const existing = await db.select().from(category).where(eq(category.title, title)).limit(1)

      if (existing.length > 0 && existing[0].id !== params.id) {
        return json({ error: "Category with this title already exists" }, { status: 409 })
      }
    }

    const updateData: Record<string, string | null | boolean> = {}
    if (title !== undefined) {
      updateData.title = title
      if (!providedSlug) {
        updateData.slug = await generateUniqueSlug(title, "category", params.id)
      }
    }
    if (providedSlug !== undefined) {
      const existingSlug = await db
        .select()
        .from(category)
        .where(eq(category.slug, providedSlug))
        .limit(1)

      if (existingSlug.length > 0 && existingSlug[0].id !== params.id) {
        updateData.slug = await generateUniqueSlug(providedSlug, "category", params.id)
      } else {
        updateData.slug = providedSlug
      }
    }
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
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
    if (status !== undefined) updateData.status = status
    if (visibility !== undefined) updateData.visibility = visibility
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription
    if (uploadedImageId !== undefined) updateData.uploadedImageId = uploadedImageId

    const [updated] = await db
      .update(category)
      .set(updateData)
      .where(eq(category.id, params.id))
      .returning()

    if (!updated) {
      return json({ error: "Category not found" }, { status: 404 })
    }

    return json(updated)
  } catch (error) {
    console.error("Error updating category:", error)
    return json({ error: "Failed to update category" }, { status: 500 })
  }
}

export const DELETE: RequestHandler = async ({ request, params }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user || session.user.role !== "admin") {
      return json({ error: "Unauthorized" }, { status: 401 })
    }

    const items = await db
      .select()
      .from(itemCategory)
      .where(eq(itemCategory.categoryId, params.id))
      .limit(1)

    if (items.length > 0) {
      const itemCount = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(itemCategory)
        .where(eq(itemCategory.categoryId, params.id))

      return json(
        {
          error: "Cannot delete category with items",
          itemCount: itemCount[0].count,
        },
        { status: 409 },
      )
    }

    const deleted = await db.delete(category).where(eq(category.id, params.id)).returning()

    if (deleted.length === 0) {
      return json({ error: "Category not found" }, { status: 404 })
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting category:", error)
    return json({ error: "Failed to delete category" }, { status: 500 })
  }
}
