CREATE INDEX "category_updated_at_idx" ON "category" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "item_updated_at_idx" ON "item" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "order_updated_at_idx" ON "order" USING btree ("updated_at");