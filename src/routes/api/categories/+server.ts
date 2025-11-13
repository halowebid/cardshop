import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { category } from "$lib/server/db/schema"
import { generateUniqueSlug } from "$lib/utils/slug"
import { eq } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async () => {
  try {
    const categories = await db.select().from(category).orderBy(category.createdAt)

    return json(categories)
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
    const { title, slug: providedSlug, imageUrl, description } = body

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

    const [newCategory] = await db
      .insert(category)
      .values({
        title,
        slug,
        imageUrl: imageUrl || null,
        description: description || null,
      })
      .returning()

    return json(newCategory, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return json({ error: "Failed to create category" }, { status: 500 })
  }
}
