import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { category } from "$lib/server/db/schema"
import {
  buildPaginationMeta,
  parsePaginationParams,
  type PaginatedResponse,
} from "$lib/types/pagination"
import { generateUniqueSlug } from "$lib/utils/slug"
import { and, desc, eq, sql } from "drizzle-orm"
import sanitizeHtml from "sanitize-html"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ url, request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const isAdmin = session?.user?.role === "admin"

    const { page, limit } = parsePaginationParams(url)

    // Build conditions
    const conditions = []
    if (!isAdmin) {
      conditions.push(eq(category.status, "active"))
      conditions.push(eq(category.visibility, true))
    }

    // Count total categories
    const countQuery =
      conditions.length > 0
        ? db
            .select({ count: sql<number>`count(*)` })
            .from(category)
            .where(and(...conditions))
        : db.select({ count: sql<number>`count(*)` }).from(category)
    const [countResult] = await countQuery
    const total = Number(countResult.count)

    // Fetch paginated categories
    const categoriesQuery =
      conditions.length > 0
        ? db
            .select()
            .from(category)
            .where(and(...conditions))
            .orderBy(desc(category.updatedAt))
            .limit(limit)
            .offset((page - 1) * limit)
        : db
            .select()
            .from(category)
            .orderBy(desc(category.updatedAt))
            .limit(limit)
            .offset((page - 1) * limit)

    const categories = await categoriesQuery

    const meta = buildPaginationMeta(page, limit, total)

    return json({ data: categories, meta })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return json({ error: "Failed to fetch categories" }, { status: 500 })
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

    if (!title) {
      return json({ error: "Title is required" }, { status: 400 })
    }

    const existing = await db.select().from(category).where(eq(category.title, title)).limit(1)

    if (existing.length > 0) {
      return json({ error: "Category with this title already exists" }, { status: 409 })
    }

    const slug = providedSlug || (await generateUniqueSlug(title, "category"))

    if (providedSlug) {
      const existingSlug = await db
        .select()
        .from(category)
        .where(eq(category.slug, providedSlug))
        .limit(1)

      if (existingSlug.length > 0) {
        return json({ error: "Category with this slug already exists" }, { status: 409 })
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

    const [newCategory] = await db
      .insert(category)
      .values({
        title,
        slug,
        imageUrl: imageUrl || null,
        description: sanitizedDescription,
        status: status || "draft",
        visibility: visibility !== undefined ? visibility : false,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        uploadedImageId: uploadedImageId || null,
      })
      .returning()

    return json(newCategory, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return json({ error: "Failed to create category" }, { status: 500 })
  }
}
