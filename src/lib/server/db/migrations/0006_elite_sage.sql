ALTER TABLE "category" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "visibility" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "uploaded_image_id" text;--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "visibility" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "item" ADD COLUMN "uploaded_image_id" text;