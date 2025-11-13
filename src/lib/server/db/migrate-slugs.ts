/**
 * Data migration script to populate slug fields for existing items and categories
 *
 * Run this after applying migration 0004_grey_ghost_rider.sql:
 * bun run src/lib/server/db/migrate-slugs.ts
 */

import { eq, isNull } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { transliterate as tr } from "transliteration"

import { category, item } from "./schema/shop.js"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set")

const client = postgres(DATABASE_URL)
const db = drizzle(client, { schema: { category, item } })

/**
 * Converts text to a URL-safe slug format
 */
function slugify(text: string) {
  return tr(text)
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/_/g, "-")
    .replace(/-+/g, "-")
    .replace(/-$/g, "")
}

/**
 * Generates a unique slug for items or categories (standalone version)
 */
async function generateUniqueSlug(
  text: string,
  tableName: "item" | "category",
  excludeId?: string,
): Promise<string> {
  const baseSlug = slugify(text)
  let slug = baseSlug
  let counter = 2

  while (true) {
    let results
    if (tableName === "item") {
      results = await db.select().from(item).where(eq(item.slug, slug)).limit(1)
    } else {
      results = await db.select().from(category).where(eq(category.slug, slug)).limit(1)
    }

    const existingRecord = results[0]
    if (!existingRecord || existingRecord.id === excludeId) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

async function migrateCategories() {
  console.log("Migrating categories...")

  const categories = await db.select().from(category).where(isNull(category.slug))

  if (categories.length === 0) {
    console.log("✓ No categories to migrate")
    return
  }

  console.log(`Found ${categories.length} categories without slugs`)

  for (const cat of categories) {
    const slug = await generateUniqueSlug(cat.title, "category", cat.id)
    await db.update(category).set({ slug }).where(eq(category.id, cat.id))
    console.log(`  ${cat.title} -> ${slug}`)
  }

  console.log(`✓ Migrated ${categories.length} categories`)
}

async function migrateItems() {
  console.log("\nMigrating items...")

  const items = await db.select().from(item).where(isNull(item.slug))

  if (items.length === 0) {
    console.log("✓ No items to migrate")
    return
  }

  console.log(`Found ${items.length} items without slugs`)

  for (const itm of items) {
    const slug = await generateUniqueSlug(itm.name, "item", itm.id)
    await db.update(item).set({ slug }).where(eq(item.id, itm.id))
    console.log(`  ${itm.name} -> ${slug}`)
  }

  console.log(`✓ Migrated ${items.length} items`)
}

async function main() {
  console.log("Starting slug data migration...\n")

  try {
    await migrateCategories()
    await migrateItems()

    console.log("\n✅ Slug migration completed successfully!")
    console.log(
      "\nNext steps:\n1. Uncomment the NOT NULL constraints in migration 0004\n2. Run: bun run db:push",
    )
  } catch (error) {
    console.error("\n❌ Migration failed:", error)
    process.exit(1)
  }

  process.exit(0)
}

main()
