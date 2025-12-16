import { json } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { rarity } from "$lib/server/db/schema/shop"
import { and, eq, ne } from "drizzle-orm"

import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ url }) => {
  try {
    const slug = url.searchParams.get("slug")
    const excludeId = url.searchParams.get("excludeId")

    if (!slug) {
      return json({ error: "Slug parameter is required" }, { status: 400 })
    }

    const conditions = [eq(rarity.slug, slug)]
    if (excludeId) {
      conditions.push(ne(rarity.id, excludeId))
    }

    const existing = await db
      .select()
      .from(rarity)
      .where(and(...conditions))
      .limit(1)

    return json({ available: existing.length === 0 })
  } catch (error) {
    console.error("Error checking slug:", error)
    return json({ error: "Failed to check slug availability" }, { status: 500 })
  }
}
