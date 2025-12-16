CREATE TABLE "item_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rarity" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"status" text DEFAULT 'active' NOT NULL,
	"visibility" boolean DEFAULT true NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"image_url" text,
	"uploaded_image_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rarity_name_unique" UNIQUE("name"),
	CONSTRAINT "rarity_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"visibility" boolean DEFAULT true NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tag_name_unique" UNIQUE("name"),
	CONSTRAINT "tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "rarity_id" text;--> statement-breakpoint
ALTER TABLE "item_tag" ADD CONSTRAINT "item_tag_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_tag" ADD CONSTRAINT "item_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "item_tag_unique_idx" ON "item_tag" USING btree ("item_id","tag_id");--> statement-breakpoint
CREATE INDEX "item_tag_item_idx" ON "item_tag" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "item_tag_tag_idx" ON "item_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rarity_name_idx" ON "rarity" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "rarity_slug_idx" ON "rarity" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "rarity_status_idx" ON "rarity" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rarity_updated_at_idx" ON "rarity" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_name_idx" ON "tag" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_slug_idx" ON "tag" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tag_status_idx" ON "tag" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tag_updated_at_idx" ON "tag" USING btree ("updated_at");--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_rarity_id_rarity_id_fk" FOREIGN KEY ("rarity_id") REFERENCES "public"."rarity"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "item_rarity_id_idx" ON "item" USING btree ("rarity_id");