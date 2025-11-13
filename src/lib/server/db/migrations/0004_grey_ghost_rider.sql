-- Step 1: Add nullable slug columns
ALTER TABLE "category" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "slug" text;--> statement-breakpoint

-- Step 2: Populate slugs for existing records (handled by separate data migration script)
-- Run: bun run db:migrate-slugs

-- Step 3: Make slug NOT NULL after data migration
-- ALTER TABLE "category" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "item" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint

-- Step 4: Add unique constraints and indexes
CREATE UNIQUE INDEX "category_slug_idx" ON "category" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "item_slug_idx" ON "item" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_slug_unique" UNIQUE("slug");