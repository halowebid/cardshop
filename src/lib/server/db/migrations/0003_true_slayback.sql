CREATE TABLE "item_category" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"category_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Migrate existing data: copy item.category_id to item_category junction table
INSERT INTO "item_category" ("id", "item_id", "category_id", "created_at")
SELECT gen_random_uuid(), "id", "category_id", now()
FROM "item"
WHERE "category_id" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "item" DROP CONSTRAINT "item_category_id_category_id_fk";
--> statement-breakpoint
DROP INDEX "item_category_idx";--> statement-breakpoint
ALTER TABLE "item_category" ADD CONSTRAINT "item_category_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_category" ADD CONSTRAINT "item_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "item_category_unique_idx" ON "item_category" USING btree ("item_id","category_id");--> statement-breakpoint
CREATE INDEX "item_category_item_idx" ON "item_category" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "item_category_category_idx" ON "item_category" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "item" DROP COLUMN "category_id";