import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { itemTag, tag } from "$lib/server/db/schema/shop"
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
      conditions.push(eq(tag.status, "active"))
      conditions.push(eq(tag.visibility, true))
    }
    if (statusFilter) {
      conditions.push(eq(tag.status, statusFilter))
    }
    if (search) {
      conditions.push(sql`${tag.name} ILIKE ${"%" + search + "%"}`)
    }

    // Count total tags
    const countQuery =
      conditions.length > 0
        ? db
            .select({ count: sql<number>`count(*)` })
            .from(tag)
            .where(and(...conditions))
        : db.select({ count: sql<number>`count(*)` }).from(tag)
    const [countResult] = await countQuery
    const total = Number(countResult.count)

    // Fetch paginated tags with usage count
    const tagsQuery =
      conditions.length > 0
        ? db
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
            .where(and(...conditions))
            .groupBy(tag.id)
            .orderBy(desc(tag.updatedAt))
            .limit(limit)
            .offset((page - 1) * limit)
        : db
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
            .groupBy(tag.id)
            .orderBy(desc(tag.updatedAt))
            .limit(limit)
            .offset((page - 1) * limit)

    const tags = await tagsQuery

    const meta = buildPaginationMeta(page, limit, total)

    return json({ data: tags, meta })
  } catch (error) {
    console.error("Error fetching tags:", error)
    return json({ error: "Failed to fetch tags" }, { status: 500 })
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
      status,
      visibility,
      metaTitle,
      metaDescription,
    } = body

    if (!name) {
      return json({ error: "Name is required" }, { status: 400 })
    }

    const existing = await db.select().from(tag).where(eq(tag.name, name)).limit(1)

    if (existing.length > 0) {
      return json({ error: "Tag with this name already exists" }, { status: 409 })
    }

    const slug = providedSlug || (await generateUniqueSlug(name, "tag"))

    if (providedSlug) {
      const existingSlug = await db.select().from(tag).where(eq(tag.slug, providedSlug)).limit(1)

      if (existingSlug.length > 0) {
        return json({ error: "Tag with this slug already exists" }, { status: 409 })
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

    const [newTag] = await db
      .insert(tag)
      .values({
        name,
        slug,
        description: sanitizedDescription,
        status: status || "draft",
        visibility: visibility !== undefined ? visibility : false,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
      })
      .returning()

    return json(newTag, { status: 201 })
  } catch (error) {
    console.error("Error creating tag:", error)
    return json({ error: "Failed to create tag" }, { status: 500 })
  }
}
