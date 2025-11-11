<script lang="ts">
  import { Separator } from "$lib/components/ui/separator"
</script>

<footer class="border-t bg-background">
  <div class="container mx-auto px-4 py-12 md:px-6 md:py-16 lg:px-8 xl:px-12">
    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <!-- Brand Section -->
      <div class="space-y-3">
        <h3 class="text-lg font-bold">CardShop</h3>
        <p class="text-sm text-muted-foreground">
          Your trusted source for trading cards. Browse, collect, and build your perfect deck.
        </p>
      </div>

      <!-- Quick Links -->
      <div class="space-y-3">
        <h4 class="text-sm font-semibold">Quick Links</h4>
        <ul class="space-y-2 text-sm">
          <li>
            <a href="/" class="text-muted-foreground transition-colors hover:text-foreground">
              Shop
            </a>
          </li>
          <li>
            <a href="/orders" class="text-muted-foreground transition-colors hover:text-foreground">
              Orders
            </a>
          </li>
          <li>
            <a href="/cart" class="text-muted-foreground transition-colors hover:text-foreground">
              Cart
            </a>
          </li>
        </ul>
      </div>

      <!-- Support Links -->
      <div class="space-y-3">
        <h4 class="text-sm font-semibold">Support</h4>
        <ul class="space-y-2 text-sm">
          <li>
            <span class="text-muted-foreground">About Us (Coming Soon)</span>
          </li>
          <li>
            <span class="text-muted-foreground">Privacy Policy (Coming Soon)</span>
          </li>
          <li>
            <span class="text-muted-foreground">Terms of Service (Coming Soon)</span>
          </li>
          <li>
            <span class="text-muted-foreground">Contact (Coming Soon)</span>
          </li>
        </ul>
      </div>
    </div>

    <Separator class="my-8" />

    <div
      class="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row"
    >
      <p>&copy; {new Date().getFullYear()} CardShop. All rights reserved.</p>
      <p>Built with SvelteKit and shadcn-svelte</p>
    </div>
  </div>
</footer>
