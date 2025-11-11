import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set")

const client = postgres(DATABASE_URL)
const db = drizzle(client, { schema })

async function seed() {
  console.log("🌱 Seeding database...")

  try {
    console.log("Creating categories...")
    const categories = await db
      .insert(schema.category)
      .values([
        {
          title: "Magic: The Gathering",
          imageUrl: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400",
          description: "Collectible and iconic Magic: The Gathering trading cards",
        },
        {
          title: "Pokemon",
          imageUrl: "https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=400",
          description: "Gotta catch 'em all! Pokemon trading card game",
        },
        {
          title: "Yu-Gi-Oh!",
          imageUrl: "https://images.unsplash.com/photo-1611329857570-f02f340e7378?w=400",
          description: "Time to duel! Yu-Gi-Oh! trading cards",
        },
        {
          title: "One Piece",
          imageUrl: "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400",
          description: "Set sail with One Piece card game",
        },
        {
          title: "Dragon Ball",
          imageUrl: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400",
          description: "Power up with Dragon Ball Super card game",
        },
      ])
      .returning()

    console.log(`✓ Created ${categories.length} categories`)

    console.log("Creating items...")
    const items = await db
      .insert(schema.item)
      .values([
        {
          categoryId: categories[0].id,
          name: "Black Lotus",
          setName: "Alpha",
          rarity: "rare",
          price: "27999.99",
          imageUrl:
            "https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg",
          description: "The most iconic and valuable Magic card ever printed",
          stockQty: 1,
        },
        {
          categoryId: categories[0].id,
          name: "Lightning Bolt",
          setName: "Beta",
          rarity: "common",
          price: "49.99",
          imageUrl:
            "https://cards.scryfall.io/large/front/c/e/ce711943-c1a1-43a0-8b89-8d169cfb8e06.jpg",
          description: "Classic red instant dealing 3 damage",
          stockQty: 25,
        },
        {
          categoryId: categories[0].id,
          name: "Jace, the Mind Sculptor",
          setName: "Worldwake",
          rarity: "mythic",
          price: "89.99",
          imageUrl:
            "https://cards.scryfall.io/large/front/c/0/c057dc0d-4017-4e60-9c5e-45fc569a8d31.jpg",
          description: "Powerful planeswalker with mind control abilities",
          stockQty: 12,
        },
        {
          categoryId: categories[0].id,
          name: "Sol Ring",
          setName: "Commander Legends",
          rarity: "uncommon",
          price: "2.99",
          imageUrl:
            "https://cards.scryfall.io/large/front/4/c/4cbc6901-6a4a-4d0a-83ea-7eefa3b35021.jpg",
          description: "Essential mana acceleration artifact",
          stockQty: 100,
        },
        {
          categoryId: categories[1].id,
          name: "Pikachu VMAX",
          setName: "Vivid Voltage",
          rarity: "rare",
          price: "24.99",
          imageUrl: "https://images.pokemontcg.io/swsh4/44_hires.png",
          description: "Electric-type VMAX Pokemon with powerful attacks",
          stockQty: 30,
        },
        {
          categoryId: categories[1].id,
          name: "Charizard V",
          setName: "Brilliant Stars",
          rarity: "rare",
          price: "45.99",
          imageUrl: "https://images.pokemontcg.io/swsh9/17_hires.png",
          description: "Fan-favorite fire-flying type Pokemon",
          stockQty: 15,
        },
        {
          categoryId: categories[1].id,
          name: "Mewtwo GX",
          setName: "Shining Legends",
          rarity: "ultra_rare",
          price: "34.99",
          imageUrl: "https://images.pokemontcg.io/sm35/72_hires.png",
          description: "Psychic-type legendary Pokemon with GX attack",
          stockQty: 20,
        },
        {
          categoryId: categories[1].id,
          name: "Professor's Research",
          setName: "Sword & Shield",
          rarity: "uncommon",
          price: "1.99",
          imageUrl: "https://images.pokemontcg.io/swsh1/178_hires.png",
          description: "Essential draw supporter card",
          stockQty: 150,
        },
        {
          categoryId: categories[2].id,
          name: "Blue-Eyes White Dragon",
          setName: "Legend of Blue Eyes",
          rarity: "ultra_rare",
          price: "149.99",
          imageUrl: "https://images.ygoprodeck.com/images/cards/89631139.jpg",
          description: "Kaiba's legendary dragon with 3000 ATK",
          stockQty: 8,
        },
        {
          categoryId: categories[2].id,
          name: "Dark Magician",
          setName: "Legendary Collection",
          rarity: "ultra_rare",
          price: "79.99",
          imageUrl: "https://images.ygoprodeck.com/images/cards/46986414.jpg",
          description: "Yugi's signature spellcaster monster",
          stockQty: 12,
        },
        {
          categoryId: categories[2].id,
          name: "Pot of Greed",
          setName: "Legend of Blue Eyes",
          rarity: "rare",
          price: "39.99",
          imageUrl: "https://images.ygoprodeck.com/images/cards/55144522.jpg",
          description: "Draw 2 cards - one of the most powerful spell cards",
          stockQty: 25,
        },
        {
          categoryId: categories[3].id,
          name: "Monkey D. Luffy Leader",
          setName: "Romance Dawn",
          rarity: "leader",
          price: "19.99",
          imageUrl: "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003.png",
          description: "Straw Hat Pirates captain leader card",
          stockQty: 40,
        },
        {
          categoryId: categories[3].id,
          name: "Roronoa Zoro",
          setName: "Romance Dawn",
          rarity: "super_rare",
          price: "29.99",
          imageUrl: "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-025.png",
          description: "Three-sword style swordsman",
          stockQty: 35,
        },
        {
          categoryId: categories[3].id,
          name: "Nami",
          setName: "Pillars of Strength",
          rarity: "rare",
          price: "14.99",
          imageUrl: "https://en.onepiece-cardgame.com/images/cardlist/card/OP03-040.png",
          description: "Navigator of the Straw Hat crew",
          stockQty: 50,
        },
        {
          categoryId: categories[4].id,
          name: "Son Goku",
          setName: "Colossal Warfare",
          rarity: "super_rare",
          price: "24.99",
          imageUrl: "https://www.dbs-cardgame.com/us-en/cardlist/img/BT3-091.png",
          description: "Super Saiyan warrior with incredible power",
          stockQty: 45,
        },
        {
          categoryId: categories[4].id,
          name: "Vegeta",
          setName: "Union Force",
          rarity: "super_rare",
          price: "22.99",
          imageUrl: "https://www.dbs-cardgame.com/us-en/cardlist/img/BT2-024.png",
          description: "Proud Saiyan prince",
          stockQty: 38,
        },
        {
          categoryId: categories[4].id,
          name: "Beerus",
          setName: "Destroyer Kings",
          rarity: "secret_rare",
          price: "39.99",
          imageUrl: "https://www.dbs-cardgame.com/us-en/cardlist/img/BT6-080.png",
          description: "God of Destruction with overwhelming power",
          stockQty: 20,
        },
      ])
      .returning()

    console.log(`✓ Created ${items.length} items`)

    console.log("✅ Database seeded successfully!")
    console.log(`   - ${categories.length} categories`)
    console.log(`   - ${items.length} items`)
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    throw error
  } finally {
    await client.end()
  }
}

seed()
