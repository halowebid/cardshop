import { error } from "@sveltejs/kit"
import { db } from "$lib/server/db"
import { category } from "$lib/server/db/schema"
import { isUUID } from "$lib/utils/slug"
import { and, eq } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
  const { slug } = params
  const isId = isUUID(slug)

  const [categoryResult] = await db
    .select()
    .from(category)
    .where(
      isId
        ? and(eq(category.id, slug), eq(category.status, "active"), eq(category.visibility, true))
        : and(
            eq(category.slug, slug),
            eq(category.status, "active"),
            eq(category.visibility, true),
          ),
    )
    .limit(1)

  if (!categoryResult) {
    throw error(404, "Category not found")
  }

  return {
    category: categoryResult,
  }
}
