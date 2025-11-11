import type { Handle } from "@sveltejs/kit"
import { building } from "$app/environment"
import { auth } from "$lib/auth"
import { svelteKitHandler } from "better-auth/svelte-kit"

const handleAuth: Handle = async ({ event, resolve }) => {
  return svelteKitHandler({ event, resolve, auth, building })
}

export const handle: Handle = handleAuth
