import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { itemTag, tag } from "$lib/server/db/schema/shop"
import { count, eq } from "drizzle-orm"
import sanitizeHtml from "sanitize-html"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ params, request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const isAdmin = session?.user?.role === "admin"

    const tagData = await db
      .select({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        status: tag.status,
        visibility: tag.visibility,
        metaTitle: tag.metaTitle,
        metaDescription: tag.metaDescription,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
        itemCount: count(itemTag.itemId),
      })
      .from(tag)
      .leftJoin(itemTag, eq(itemTag.tagId, tag.id))
      .where(eq(tag.id, params.id))
      .groupBy(tag.id)
      .limit(1)

    if (tagData.length === 0) {
      return json({ error: "Tag not found" }, { status: 404 })
    }

    const [tagRecord] = tagData

    if (!isAdmin && (tagRecord.status !== "active" || !tagRecord.visibility)) {
      return json({ error: "Tag not found" }, { status: 404 })
    }

    return json(tagRecord)
  } catch (error) {
    console.error("Error fetching tag:", error)
    return json({ error: "Failed to fetch tag" }, { status: 500 })
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
    const { name, slug, description, status, visibility, metaTitle, metaDescription } = body

    const existing = await db.select().from(tag).where(eq(tag.id, params.id)).limit(1)

    if (existing.length === 0) {
      return json({ error: "Tag not found" }, { status: 404 })
    }

    if (name && name !== existing[0].name) {
      const nameExists = await db.select().from(tag).where(eq(tag.name, name)).limit(1)

      if (nameExists.length > 0) {
        return json({ error: "Tag with this name already exists" }, { status: 409 })
      }
    }

    if (slug && slug !== existing[0].slug) {
      const slugExists = await db.select().from(tag).where(eq(tag.slug, slug)).limit(1)

      if (slugExists.length > 0) {
        return json({ error: "Tag with this slug already exists" }, { status: 409 })
      }
    }

    // Sanitize HTML description if provided
    const sanitizedDescription =
      description !== undefined
        ? description
          ? sanitizeHtml(description, {
              allowedTags: ["p", "br", "strong", "em", "a", "ul", "ol", "li", "h2", "h3"],
              allowedAttributes: {
                a: ["href", "target", "rel"],
              },
            })
          : null
        : undefined

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (sanitizedDescription !== undefined) updateData.description = sanitizedDescription
    if (status !== undefined) updateData.status = status
    if (visibility !== undefined) updateData.visibility = visibility
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription

    const [updatedTag] = await db
      .update(tag)
      .set(updateData)
      .where(eq(tag.id, params.id))
      .returning()

    return json(updatedTag)
  } catch (error) {
    console.error("Error updating tag:", error)
    return json({ error: "Failed to update tag" }, { status: 500 })
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

    // Check if tag is in use
    const [usageCount] = await db
      .select({ count: count(itemTag.itemId) })
      .from(itemTag)
      .where(eq(itemTag.tagId, params.id))

    if (Number(usageCount.count) > 0) {
      return json(
        { error: `Cannot delete tag. It is used by ${usageCount.count} item(s)` },
        { status: 409 },
      )
    }

    const existing = await db.select().from(tag).where(eq(tag.id, params.id)).limit(1)

    if (existing.length === 0) {
      return json({ error: "Tag not found" }, { status: 404 })
    }

    await db.delete(tag).where(eq(tag.id, params.id))

    return json({ success: true })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return json({ error: "Failed to delete tag" }, { status: 500 })
  }
}
