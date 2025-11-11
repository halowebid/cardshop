import { env } from "$env/dynamic/public"
import { createAuthClient } from "better-auth/svelte"

export const client = createAuthClient({
  baseURL: env.PUBLIC_SITE_URL ?? "http://localhost:5173",
})

export const { signIn, signUp, useSession } = client
