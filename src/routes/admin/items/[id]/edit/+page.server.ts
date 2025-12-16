import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
  return {
    itemId: params.id,
  }
}
