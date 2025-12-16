import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { item, rarity } from "$lib/server/db/schema/shop"
import { count, eq } from "drizzle-orm"
import sanitizeHtml from "sanitize-html"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ params, request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const isAdmin = session?.user?.role === "admin"

    const rarityData = await db
      .select({
        id: rarity.id,
        name: rarity.name,
        slug: rarity.slug,
        description: rarity.description,
        color: rarity.color,
        status: rarity.status,
        visibility: rarity.visibility,
        metaTitle: rarity.metaTitle,
        metaDescription: rarity.metaDescription,
        imageUrl: rarity.imageUrl,
        uploadedImageId: rarity.uploadedImageId,
        createdAt: rarity.createdAt,
        updatedAt: rarity.updatedAt,
        itemCount: count(item.id),
      })
      .from(rarity)
      .leftJoin(item, eq(item.rarityId, rarity.id))
      .where(eq(rarity.id, params.id))
      .groupBy(rarity.id)
      .limit(1)

    if (rarityData.length === 0) {
      return json({ error: "Rarity not found" }, { status: 404 })
    }

    const [rarityRecord] = rarityData

    if (!isAdmin && (rarityRecord.status !== "active" || !rarityRecord.visibility)) {
      return json({ error: "Rarity not found" }, { status: 404 })
    }

    return json(rarityRecord)
  } catch (error) {
    console.error("Error fetching rarity:", error)
    return json({ error: "Failed to fetch rarity" }, { status: 500 })
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
      name,
      slug,
      description,
      color,
      status,
      visibility,
      metaTitle,
      metaDescription,
      imageUrl,
      uploadedImageId,
    } = body

    const existing = await db.select().from(rarity).where(eq(rarity.id, params.id)).limit(1)

    if (existing.length === 0) {
      return json({ error: "Rarity not found" }, { status: 404 })
    }

    if (name && name !== existing[0].name) {
      const nameExists = await db.select().from(rarity).where(eq(rarity.name, name)).limit(1)

      if (nameExists.length > 0) {
        return json({ error: "Rarity with this name already exists" }, { status: 409 })
      }
    }

    if (slug && slug !== existing[0].slug) {
      const slugExists = await db.select().from(rarity).where(eq(rarity.slug, slug)).limit(1)

      if (slugExists.length > 0) {
        return json({ error: "Rarity with this slug already exists" }, { status: 409 })
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
    if (color !== undefined) updateData.color = color
    if (status !== undefined) updateData.status = status
    if (visibility !== undefined) updateData.visibility = visibility
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (uploadedImageId !== undefined) updateData.uploadedImageId = uploadedImageId

    const [updatedRarity] = await db
      .update(rarity)
      .set(updateData)
      .where(eq(rarity.id, params.id))
      .returning()

    return json(updatedRarity)
  } catch (error) {
    console.error("Error updating rarity:", error)
    return json({ error: "Failed to update rarity" }, { status: 500 })
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

    // Check if rarity is in use
    const [usageCount] = await db
      .select({ count: count(item.id) })
      .from(item)
      .where(eq(item.rarityId, params.id))

    if (Number(usageCount.count) > 0) {
      return json(
        { error: `Cannot delete rarity. It is used by ${usageCount.count} item(s)` },
        { status: 409 },
      )
    }

    const existing = await db.select().from(rarity).where(eq(rarity.id, params.id)).limit(1)

    if (existing.length === 0) {
      return json({ error: "Rarity not found" }, { status: 404 })
    }

    await db.delete(rarity).where(eq(rarity.id, params.id))

    return json({ success: true })
  } catch (error) {
    console.error("Error deleting rarity:", error)
    return json({ error: "Failed to delete rarity" }, { status: 500 })
  }
}
