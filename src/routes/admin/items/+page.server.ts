import { error } from "@sveltejs/kit"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const [itemsRes, categoriesRes] = await Promise.all([
      fetch("/api/items"),
      fetch("/api/categories"),
    ])

    if (!itemsRes.ok || !categoriesRes.ok) {
      throw new Error("One or more API requests failed")
    }

    const items = await itemsRes.json()
    const categories = await categoriesRes.json()

    return {
      items,
      categories,
    }
  } catch (err) {
    console.error("Failed to load items:", err)
    throw error(500, "Failed to load items. Please try again later.")
  }
}
