import { json } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { item } from "$lib/server/db/schema/shop"
import { and, eq, ne } from "drizzle-orm"

import type { RequestHandler } from "./$types"

/**
 * Checks if an item slug is available
 * GET /api/items/check-slug?slug=test-slug&excludeId=uuid (optional)
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    const slug = url.searchParams.get("slug")
    const excludeId = url.searchParams.get("excludeId")

    if (!slug) {
      return json({ error: "Slug parameter is required" }, { status: 400 })
    }

    const conditions = excludeId
      ? and(eq(item.slug, slug), ne(item.id, excludeId))
      : eq(item.slug, slug)

    const existing = await db.select({ id: item.id }).from(item).where(conditions).limit(1)

    return json({ available: existing.length === 0 })
  } catch (error) {
    console.error("Error checking slug:", error)
    return json({ error: "Failed to check slug" }, { status: 500 })
  }
}
