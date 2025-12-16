import { json } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { category } from "$lib/server/db/schema/shop"
import { and, eq, ne } from "drizzle-orm"

import type { RequestHandler } from "./$types"

/**
 * Checks if a category slug is available
 * GET /api/categories/check-slug?slug=test-slug&excludeId=uuid (optional)
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const slug = url.searchParams.get("slug")
    const excludeId = url.searchParams.get("excludeId")

    if (!slug) {
      return json({ error: "Slug parameter is required" }, { status: 400 })
    }

    const conditions = excludeId
      ? and(eq(category.slug, slug), ne(category.id, excludeId))
      : eq(category.slug, slug)

    const existing = await db.select({ id: category.id }).from(category).where(conditions).limit(1)

    return json({ available: existing.length === 0 })
  } catch (error) {
    console.error("Error checking slug:", error)
    return json({ error: "Failed to check slug" }, { status: 500 })
  }
}
