import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { item, rarity } from "$lib/server/db/schema/shop"
import { buildPaginationMeta, parsePaginationParams } from "$lib/types/pagination"
import { generateUniqueSlug } from "$lib/utils/slug"
import { and, count, desc, eq, sql } from "drizzle-orm"
import sanitizeHtml from "sanitize-html"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ url, request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const isAdmin = session?.user?.role === "admin"

    const { page, limit } = parsePaginationParams(url)
    const search = url.searchParams.get("search")
    const statusFilter = url.searchParams.get("status")

    // Build conditions
    const conditions = []
    if (!isAdmin) {
      conditions.push(eq(rarity.status, "active"))
      conditions.push(eq(rarity.visibility, true))
    }
    if (statusFilter) {
      conditions.push(eq(rarity.status, statusFilter))
    }
    if (search) {
      conditions.push(sql`${rarity.name} ILIKE ${"%" + search + "%"}`)
    }

    // Count total rarities
    const countQuery =
      conditions.length > 0
        ? db
            .select({ count: sql<number>`count(*)` })
            .from(rarity)
            .where(and(...conditions))
        : db.select({ count: sql<number>`count(*)` }).from(rarity)
    const [countResult] = await countQuery
    const total = Number(countResult.count)

    // Fetch paginated rarities with usage count
    const raritiesQuery =
      conditions.length > 0
        ? db
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
            .where(and(...conditions))
            .groupBy(rarity.id)
            .orderBy(desc(rarity.updatedAt))
            .limit(limit)
            .offset((page - 1) * limit)
        : db
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
            .groupBy(rarity.id)
            .orderBy(desc(rarity.updatedAt))
            .limit(limit)
            .offset((page - 1) * limit)

    const rarities = await raritiesQuery

    const meta = buildPaginationMeta(page, limit, total)

    return json({ data: rarities, meta })
  } catch (error) {
    console.error("Error fetching rarities:", error)
    return json({ error: "Failed to fetch rarities" }, { status: 500 })
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
      name,
      slug: providedSlug,
      description,
      color,
      status,
      visibility,
      metaTitle,
      metaDescription,
      imageUrl,
      uploadedImageId,
    } = body

    if (!name) {
      return json({ error: "Name is required" }, { status: 400 })
    }

    const existing = await db.select().from(rarity).where(eq(rarity.name, name)).limit(1)

    if (existing.length > 0) {
      return json({ error: "Rarity with this name already exists" }, { status: 409 })
    }

    const slug = providedSlug || (await generateUniqueSlug(name, "rarity"))

    if (providedSlug) {
      const existingSlug = await db
        .select()
        .from(rarity)
        .where(eq(rarity.slug, providedSlug))
        .limit(1)

      if (existingSlug.length > 0) {
        return json({ error: "Rarity with this slug already exists" }, { status: 409 })
      }
    }

    // Sanitize HTML description if provided
    const sanitizedDescription = description
      ? sanitizeHtml(description, {
          allowedTags: ["p", "br", "strong", "em", "a", "ul", "ol", "li", "h2", "h3"],
          allowedAttributes: {
            a: ["href", "target", "rel"],
          },
        })
      : null

    const [newRarity] = await db
      .insert(rarity)
      .values({
        name,
        slug,
        description: sanitizedDescription,
        color: color || null,
        status: status || "draft",
        visibility: visibility !== undefined ? visibility : false,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        imageUrl: imageUrl || null,
        uploadedImageId: uploadedImageId || null,
      })
      .returning()

    return json(newRarity, { status: 201 })
  } catch (error) {
    console.error("Error creating rarity:", error)
    return json({ error: "Failed to create rarity" }, { status: 500 })
  }
}
