import { json } from "@sveltejs/kit"
import { auth } from "$lib/auth"
import { db } from "$lib/server/db"
import { category, item, itemCategory } from "$lib/server/db/schema"
import { eq, sql } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ params }) => {
  try {
    const [categoryData] = await db
      .select({
        id: category.id,
        title: category.title,
        imageUrl: category.imageUrl,
        description: category.description,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        itemCount: sql<number>`cast(count(${itemCategory.itemId}) as integer)`,
      })
      .from(category)
      .leftJoin(itemCategory, eq(itemCategory.categoryId, category.id))
      .where(eq(category.id, params.id))
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
    const { title, imageUrl, description } = body

    if (title) {
      const existing = await db.select().from(category).where(eq(category.title, title)).limit(1)

      if (existing.length > 0 && existing[0].id !== params.id) {
        return json({ error: "Category with this title already exists" }, { status: 409 })
      }
    }

    const updateData: Record<string, string | null> = {}
    if (title !== undefined) updateData.title = title
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (description !== undefined) updateData.description = description

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
