<script lang="ts">
  import { goto } from "$app/navigation"
  import { client } from "$lib/auth-client"
  import { Avatar, AvatarFallback, AvatarImage } from "$lib/components/ui/avatar"
  import { Button } from "$lib/components/ui/button"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "$lib/components/ui/dropdown-menu"

  type Props = {
    user: {
      name?: string
      email: string
      image?: string | null
    } | null
  }

  let { user }: Props = $props()

  async function handleSignOut() {
    await client.signOut()
    goto("/auth/sign-in")
  }

  function getInitials(name?: string, email?: string): string {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email ? email[0].toUpperCase() : "U"
  }
</script>

{#if user}
  <DropdownMenu>
    <DropdownMenuTrigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          class="relative h-9 w-9 rounded-full"
          aria-label="User menu"
        >
          <Avatar class="h-9 w-9">
            {#if user.image}
              <AvatarImage src={user.image} alt={user.name || user.email} />
            {/if}
            <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      {/snippet}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel class="font-normal">
        <div class="flex flex-col space-y-1">
          <p class="text-sm leading-none font-medium">{user.name || "User"}</p>
          <p class="text-xs leading-none text-muted-foreground">{user.email}</p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        {#snippet child({ props })}
          <a {...props} href="/orders">My Orders</a>
        {/snippet}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onclick={handleSignOut}>Sign Out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
{:else}
  <Button variant="default" href="/auth/sign-in">Sign In</Button>
{/if}
