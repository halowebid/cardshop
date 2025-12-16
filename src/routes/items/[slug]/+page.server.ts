import { error } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { category, item, itemCategory } from "$lib/server/db/schema"
import { isUUID } from "$lib/utils/slug"
import { and, eq, gt, inArray } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
  const { slug } = params
  const isId = isUUID(slug)

  const itemResult = await db.query.item.findFirst({
    where: isId
      ? and(eq(item.id, slug), eq(item.status, "active"), eq(item.visibility, true))
      : and(eq(item.slug, slug), eq(item.status, "active"), eq(item.visibility, true)),
    with: {
      rarity: true,
      itemTags: {
        with: {
          tag: true,
        },
      },
    },
  })

  if (!itemResult) {
    throw error(404, "Item not found")
  }

  const itemId = itemResult.id

  const categories = await db
    .select({
      id: category.id,
      title: category.title,
      slug: category.slug,
      imageUrl: category.imageUrl,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    })
    .from(itemCategory)
    .innerJoin(category, eq(itemCategory.categoryId, category.id))
    .where(eq(itemCategory.itemId, itemId))

  const categoryIds = await db
    .select({ categoryId: itemCategory.categoryId })
    .from(itemCategory)
    .where(eq(itemCategory.itemId, itemId))

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
    (id) => id !== itemId,
  )

  const relatedItems =
    uniqueRelatedItemIds.length > 0
      ? await db.query.item.findMany({
          where: and(
            inArray(item.id, uniqueRelatedItemIds),
            gt(item.stockQty, 0),
            eq(item.status, "active"),
            eq(item.visibility, true),
          ),
          limit: 8,
          with: {
            rarity: true,
          },
        })
      : []

  return {
    item: {
      ...itemResult,
      tags: itemResult.itemTags.map((it) => it.tag),
    },
    categories,
    relatedItems,
  }
}
