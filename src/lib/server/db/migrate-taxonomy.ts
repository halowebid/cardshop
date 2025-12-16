/**
 * Data migration script to convert rarity and tags from text/array fields to relational tables
 * Run this AFTER applying the schema migration (0007_sweet_goliath.sql)
 * This script uses Drizzle ORM to safely migrate existing data
 */

import { slugify } from "$lib/utils/slugify"
import { and, eq } from "drizzle-orm"

import { db } from "."
import { item, itemTag, rarity, tag } from "./schema/shop"

/**
 * Extract unique rarities from existing items and create rarity records
 */
async function migrateRarities() {
  console.log("Starting rarity migration...")

  // Get all items with rarity values using Drizzle
  const items = await db.select({ rarity: item.rarity }).from(item)

  // Extract unique rarities (case-insensitive)
  const uniqueRarities = [
    ...new Set(items.map((i) => i.rarity?.toLowerCase().trim()).filter(Boolean)),
  ]

  console.log(`Found ${uniqueRarities.length} unique rarities:`, uniqueRarities)

  // Define default colors for common rarity names
  const rarityColors: Record<string, string> = {
    common: "#9CA3AF", // gray
    uncommon: "#22C55E", // green
    rare: "#3B82F6", // blue
    super_rare: "#8B5CF6", // purple
    ultra_rare: "#EC4899", // pink
    secret_rare: "#F59E0B", // amber
    mythic: "#DC2626", // red
    legendary: "#D97706", // orange
    leader: "#14B8A6", // teal
    special_rare: "#A855F7", // violet
  }

  // Create rarity records
  for (const rarityValue of uniqueRarities) {
    if (!rarityValue) continue

    const name = rarityValue
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
    const slug = slugify(rarityValue)
    const color = rarityColors[rarityValue] || "#6B7280" // default gray

    // Check if rarity already exists
    const existing = await db.query.rarity.findFirst({
      where: eq(rarity.slug, slug),
    })

    if (!existing) {
      await db.insert(rarity).values({
        name,
        slug,
        color,
        status: "active",
        visibility: true,
      })
      console.log(`Created rarity: ${name} (${slug})`)
    } else {
      console.log(`Rarity already exists: ${name}`)
    }
  }

  console.log("Rarity migration completed!")
}

/**
 * Update item.rarityId to reference new rarity records
 */
async function linkItemsToRarities() {
  console.log("Linking items to rarities...")

  // Get all items with rarity values
  const items = await db
    .select({
      id: item.id,
      rarityText: item.rarity,
    })
    .from(item)

  let linkedCount = 0

  for (const itemRow of items) {
    if (!itemRow.rarityText) continue

    const rarityValue = itemRow.rarityText.toLowerCase().trim()
    const slug = slugify(rarityValue)

    // Find matching rarity record
    const rarityRecord = await db.query.rarity.findFirst({
      where: eq(rarity.slug, slug),
    })

    if (rarityRecord) {
      await db.update(item).set({ rarityId: rarityRecord.id }).where(eq(item.id, itemRow.id))

      linkedCount++
    } else {
      console.warn(`No rarity found for item ${itemRow.id} with rarity "${rarityValue}"`)
    }
  }

  console.log(`Linked ${linkedCount} items to rarities`)
}

/**
 * Extract unique tags from existing items and create tag records
 */
async function migrateTags() {
  console.log("Starting tag migration...")

  // Get all items with tags using Drizzle
  const items = await db.select({ tags: item.tags }).from(item)

  // Extract unique tags from all arrays
  const allTags = items.flatMap((i) => i.tags || []).filter(Boolean)
  const uniqueTags = [...new Set(allTags.map((t) => t.trim()))]

  console.log(`Found ${uniqueTags.length} unique tags`)

  // Create tag records
  for (const tagValue of uniqueTags) {
    const name = tagValue.trim()
    const slug = slugify(name)

    // Check if tag already exists
    const existing = await db.query.tag.findFirst({
      where: eq(tag.slug, slug),
    })

    if (!existing) {
      await db.insert(tag).values({
        name,
        slug,
        status: "active",
        visibility: true,
      })
      console.log(`Created tag: ${name} (${slug})`)
    } else {
      console.log(`Tag already exists: ${name}`)
    }
  }

  console.log("Tag migration completed!")
}

/**
 * Create item_tag associations from existing tag arrays
 */
async function linkItemsToTags() {
  console.log("Linking items to tags...")

  // Get all items with tags
  const items = await db
    .select({
      id: item.id,
      tags: item.tags,
    })
    .from(item)

  let associationCount = 0

  for (const itemRow of items) {
    if (!itemRow.tags || itemRow.tags.length === 0) continue

    for (const tagValue of itemRow.tags) {
      if (!tagValue) continue

      const slug = slugify(tagValue.trim())

      // Find matching tag record
      const tagRecord = await db.query.tag.findFirst({
        where: eq(tag.slug, slug),
      })

      if (tagRecord) {
        // Check if association already exists
        const existing = await db.query.itemTag.findFirst({
          where: and(eq(itemTag.itemId, itemRow.id), eq(itemTag.tagId, tagRecord.id)),
        })

        if (!existing) {
          await db.insert(itemTag).values({
            itemId: itemRow.id,
            tagId: tagRecord.id,
          })
          associationCount++
        }
      } else {
        console.warn(`No tag found for item ${itemRow.id} with tag "${tagValue}"`)
      }
    }
  }

  console.log(`Created ${associationCount} item-tag associations`)
}

/**
 * Main migration function - runs all migration steps in order
 */
export async function runTaxonomyMigration() {
  console.log("=== Starting Taxonomy Migration ===")

  try {
    await migrateRarities()
    await linkItemsToRarities()
    await migrateTags()
    await linkItemsToTags()

    console.log("=== Taxonomy Migration Completed Successfully ===")
    console.log(
      "Next steps: Drop the old rarity and tags columns with a new Drizzle migration after verifying data integrity",
    )
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTaxonomyMigration()
    .then(() => {
      console.log("\nMigration completed successfully!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("\nMigration failed:", error)
      process.exit(1)
    })
}
