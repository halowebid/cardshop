import { error } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { category, item, itemCategory } from "$lib/server/db/schema"
import { and, eq, gt, inArray } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params

  const [categoryResult] = await db.select().from(category).where(eq(category.id, id)).limit(1)

  if (!categoryResult) {
    throw error(404, "Category not found")
  }

  const itemIds = await db
    .select({ itemId: itemCategory.itemId })
    .from(itemCategory)
    .where(eq(itemCategory.categoryId, id))

  const items =
    itemIds.length > 0
      ? await db
          .select()
          .from(item)
          .where(
            and(
              inArray(
                item.id,
                itemIds.map((i) => i.itemId),
              ),
              gt(item.stockQty, 0),
            ),
          )
      : []

  return {
    category: categoryResult,
    items,
  }
}
