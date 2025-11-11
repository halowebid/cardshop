import { redirect } from "@sveltejs/kit"
import { auth } from "$lib/auth"

import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async (event) => {
  const session = await auth.api.getSession({
    headers: event.request.headers,
  })

  if (!session?.user || session.user.role !== "admin") {
    throw redirect(303, "/auth/sign-in")
  }

  return {
    user: session.user,
  }
}
