import { error } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { category, item } from "$lib/server/db/schema"
import { and, eq, gt, ne } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params

  // Fetch the item with category info
  const [itemResult] = await db
    .select({
      item: item,
      category: category,
    })
    .from(item)
    .leftJoin(category, eq(item.categoryId, category.id))
    .where(eq(item.id, id))
    .limit(1)

  if (!itemResult) {
    throw error(404, "Item not found")
  }

  // Fetch related items from the same category (up to 8, excluding current item)
  const relatedItems = await db
    .select()
    .from(item)
    .where(
      and(eq(item.categoryId, itemResult.item.categoryId), ne(item.id, id), gt(item.stockQty, 0)),
    )
    .limit(8)

  return {
    item: itemResult.item,
    category: itemResult.category,
    relatedItems,
  }
}
