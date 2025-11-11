import { db } from "$lib/server/db"
import { category, item } from "$lib/server/db/schema"
import { gt } from "drizzle-orm"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async () => {
  const categories = await db.select().from(category)

  const items = await db.select().from(item).where(gt(item.stockQty, 0))

  return {
    categories,
    items,
  }
}
