import { error } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { category, item } from "$lib/server/db/schema"
import { and, eq, gt } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params

  // Fetch the category
  const [categoryResult] = await db.select().from(category).where(eq(category.id, id)).limit(1)

  if (!categoryResult) {
    throw error(404, "Category not found")
  }

  // Fetch all items in this category with stock > 0
  const items = await db
    .select()
    .from(item)
    .where(and(eq(item.categoryId, id), gt(item.stockQty, 0)))

  return {
    category: categoryResult,
    items,
  }
}
