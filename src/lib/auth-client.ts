import { oneTapClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/svelte"

export const authClient = createAuthClient({
  baseURL: import.meta.env.BETTER_AUTH_URL ?? "http://localhost:5173",
  plugins: [
    oneTapClient({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      autoSelect: false,
      cancelOnTapOutside: true,
      context: "signin",
      additionalOptions: {},
      promptOptions: {
        baseDelay: 1000,
        maxAttempts: 5,
      },
    }),
  ],
})

export const signIn = async () => {
  const data = await authClient.signIn.social({
    provider: "google",
  })

  return data
}
