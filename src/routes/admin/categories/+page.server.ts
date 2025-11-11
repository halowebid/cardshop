import { error } from "@sveltejs/kit"

import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const response = await fetch("/api/categories")

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const categories = await response.json()

    return {
      categories,
    }
  } catch (err) {
    console.error("Failed to load categories:", err)
    throw error(500, "Failed to load categories. Please try again later.")
  }
}
