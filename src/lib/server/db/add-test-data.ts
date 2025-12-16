import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set")

const client = postgres(DATABASE_URL)
const db = drizzle(client, { schema })

async function addTestData() {
  console.log("🌱 Adding test data...")

  try {
    // Add more categories to reach 25+ total
    console.log("Creating additional categories...")
    const newCategories = await db
      .insert(schema.category)
      .values([
        {
          title: "Flesh and Blood TCG",
          slug: "flesh-and-blood-tcg",
          imageUrl: "https://picsum.photos/220",
          description: "Trading card game of strategic combat",
        },
        {
          title: "KeyForge Cards",
          slug: "keyforge-cards",
          imageUrl: "https://picsum.photos/221",
          description: "Unique deck game",
        },
        {
          title: "Final Fantasy Trading Cards",
          slug: "final-fantasy-trading-cards",
          imageUrl: "https://picsum.photos/222",
          description: "Card game featuring Final Fantasy",
        },
        {
          title: "Star Wars TCG",
          slug: "star-wars-tcg",
          imageUrl: "https://picsum.photos/223",
          description: "Galactic battles",
        },
        {
          title: "Disney Lorcana",
          slug: "disney-lorcana",
          imageUrl: "https://picsum.photos/224",
          description: "Disney trading card game",
        },
        {
          title: "Weiss Schwarz EN",
          slug: "weiss-schwarz-en",
          imageUrl: "https://picsum.photos/225",
          description: "Anime crossover TCG",
        },
        {
          title: "Shadowverse Evolve",
          slug: "shadowverse-evolve",
          imageUrl: "https://picsum.photos/226",
          description: "Strategic fantasy card game",
        },
        {
          title: "Legends of Runeterra Cards",
          slug: "legends-of-runeterra-cards",
          imageUrl: "https://picsum.photos/227",
          description: "League of Legends card game",
        },
        {
          title: "Hearthstone Merchandise",
          slug: "hearthstone-merchandise",
          imageUrl: "https://picsum.photos/228",
          description: "Warcraft card game",
        },
        {
          title: "Gwent Cards",
          slug: "gwent-cards",
          imageUrl: "https://picsum.photos/229",
          description: "The Witcher card game",
        },
        {
          title: "Marvel Snap Cards",
          slug: "marvel-snap-cards",
          imageUrl: "https://picsum.photos/230",
          description: "Marvel superhero card game",
        },
        {
          title: "Splinterlands NFT",
          slug: "splinterlands-nft",
          imageUrl: "https://picsum.photos/231",
          description: "Blockchain card game",
        },
        {
          title: "Gods Unchained NFT",
          slug: "gods-unchained-nft",
          imageUrl: "https://picsum.photos/232",
          description: "Blockchain tactical card game",
        },
        {
          title: "Force of Will Cards",
          slug: "force-of-will-cards",
          imageUrl: "https://picsum.photos/233",
          description: "Fantasy TCG",
        },
        {
          title: "Battle Spirits TCG",
          slug: "battle-spirits-tcg",
          imageUrl: "https://picsum.photos/234",
          description: "Spirit summoning card game",
        },
        {
          title: "Duel Masters Cards",
          slug: "duel-masters-cards",
          imageUrl: "https://picsum.photos/235",
          description: "Japanese trading card game",
        },
        {
          title: "Buddyfight TCG",
          slug: "buddyfight-tcg",
          imageUrl: "https://picsum.photos/236",
          description: "Buddy monster card game",
        },
      ])
      .returning()

    console.log(`✓ Created ${newCategories.length} additional categories`)

    // Add more items to reach 30+ total
    console.log("Creating additional items...")
    const newItems = await db
      .insert(schema.item)
      .values([
        {
          name: "Test Card 1",
          slug: "test-card-1",
          setName: "Test Set",
          rarity: "common",
          price: "5.99",
          stockQty: 50,
        },
        {
          name: "Test Card 2",
          slug: "test-card-2",
          setName: "Test Set",
          rarity: "uncommon",
          price: "8.99",
          stockQty: 40,
        },
        {
          name: "Test Card 3",
          slug: "test-card-3",
          setName: "Test Set",
          rarity: "rare",
          price: "15.99",
          stockQty: 30,
        },
        {
          name: "Test Card 4",
          slug: "test-card-4",
          setName: "Test Set",
          rarity: "rare",
          price: "18.99",
          stockQty: 25,
        },
        {
          name: "Test Card 5",
          slug: "test-card-5",
          setName: "Test Set",
          rarity: "super_rare",
          price: "25.99",
          stockQty: 20,
        },
        {
          name: "Test Card 6",
          slug: "test-card-6",
          setName: "Test Set",
          rarity: "super_rare",
          price: "28.99",
          stockQty: 18,
        },
        {
          name: "Test Card 7",
          slug: "test-card-7",
          setName: "Test Set",
          rarity: "ultra_rare",
          price: "45.99",
          stockQty: 15,
        },
        {
          name: "Test Card 8",
          slug: "test-card-8",
          setName: "Test Set",
          rarity: "ultra_rare",
          price: "49.99",
          stockQty: 12,
        },
        {
          name: "Test Card 9",
          slug: "test-card-9",
          setName: "Test Set",
          rarity: "secret_rare",
          price: "75.99",
          stockQty: 10,
        },
        {
          name: "Test Card 10",
          slug: "test-card-10",
          setName: "Test Set",
          rarity: "secret_rare",
          price: "89.99",
          stockQty: 8,
        },
        {
          name: "Test Card 11",
          slug: "test-card-11",
          setName: "Test Set 2",
          rarity: "common",
          price: "6.99",
          stockQty: 45,
        },
        {
          name: "Test Card 12",
          slug: "test-card-12",
          setName: "Test Set 2",
          rarity: "uncommon",
          price: "9.99",
          stockQty: 35,
        },
      ])
      .returning()

    console.log(`✓ Created ${newItems.length} additional items`)

    // Link first 5 new items to first new category
    if (newCategories.length > 0 && newItems.length > 0) {
      await db.insert(schema.itemCategory).values(
        newItems.slice(0, 5).map((item) => ({
          itemId: item.id,
          categoryId: newCategories[0].id,
        })),
      )
      console.log("✓ Created item-category associations")
    }

    console.log("✅ Test data added successfully!")
    console.log(`   - Added ${newCategories.length} categories`)
    console.log(`   - Added ${newItems.length} items`)
  } catch (error) {
    console.error("❌ Error adding test data:", error)
    throw error
  } finally {
    await client.end()
  }
}

addTestData()
