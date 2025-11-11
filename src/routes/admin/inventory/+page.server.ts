import { error } from "@sveltejs/kit"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const response = await fetch("/api/items")

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const items = await response.json()

    return {
      items,
    }
  } catch (err) {
    console.error("Failed to load inventory:", err)
    throw error(500, "Failed to load inventory. Please try again later.")
  }
}
