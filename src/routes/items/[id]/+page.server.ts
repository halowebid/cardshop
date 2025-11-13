import { error } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { category, item, itemCategory } from "$lib/server/db/schema"
import { and, eq, gt, inArray, ne } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params

  const [itemResult] = await db.select().from(item).where(eq(item.id, id)).limit(1)

  if (!itemResult) {
    throw error(404, "Item not found")
  }

  const categories = await db
    .select({
      id: category.id,
      title: category.title,
      imageUrl: category.imageUrl,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    })
    .from(itemCategory)
    .innerJoin(category, eq(itemCategory.categoryId, category.id))
    .where(eq(itemCategory.itemId, id))

  const categoryIds = await db
    .select({ categoryId: itemCategory.categoryId })
    .from(itemCategory)
    .where(eq(itemCategory.itemId, id))

  const relatedItemIds =
    categoryIds.length > 0
      ? await db
          .select({ itemId: itemCategory.itemId })
          .from(itemCategory)
          .where(
            inArray(
              itemCategory.categoryId,
              categoryIds.map((c) => c.categoryId),
            ),
          )
      : []

  const uniqueRelatedItemIds = [...new Set(relatedItemIds.map((r) => r.itemId))].filter(
    (itemId) => itemId !== id,
  )

  const relatedItems =
    uniqueRelatedItemIds.length > 0
      ? await db
          .select()
          .from(item)
          .where(and(inArray(item.id, uniqueRelatedItemIds), gt(item.stockQty, 0)))
          .limit(8)
      : []

  return {
    item: itemResult,
    categories,
    relatedItems,
  }
}
