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
          slug: "magic-the-gathering",
          imageUrl: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400",
          description: "Collectible and iconic Magic: The Gathering trading cards",
        },
        {
          title: "Pokemon",
          slug: "pokemon",
          imageUrl: "https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=400",
          description: "Gotta catch 'em all! Pokemon trading card game",
        },
        {
          title: "Yu-Gi-Oh!",
          slug: "yu-gi-oh",
          imageUrl: "https://images.unsplash.com/photo-1611329857570-f02f340e7378?w=400",
          description: "Time to duel! Yu-Gi-Oh! trading cards",
        },
        {
          title: "One Piece",
          slug: "one-piece",
          imageUrl: "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400",
          description: "Set sail with One Piece card game",
        },
        {
          title: "Dragon Ball",
          slug: "dragon-ball",
          imageUrl: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400",
          description: "Power up with Dragon Ball Super card game",
        },
        {
          title: "Cardfight!! Vanguard",
          slug: "cardfight-vanguard",
          imageUrl: "https://picsum.photos/200",
          description: "Strategic card battles with Vanguard units",
        },
        {
          title: "Digimon",
          slug: "digimon",
          imageUrl: "https://picsum.photos/201",
          description: "Digital monsters card game",
        },
        {
          title: "Flesh and Blood",
          slug: "flesh-and-blood",
          imageUrl: "https://picsum.photos/202",
          description: "Trading card game of strategic combat",
        },
        {
          title: "KeyForge",
          slug: "keyforge",
          imageUrl: "https://picsum.photos/203",
          description: "Unique deck game where every deck is one-of-a-kind",
        },
        {
          title: "Final Fantasy TCG",
          slug: "final-fantasy-tcg",
          imageUrl: "https://picsum.photos/204",
          description: "Card game featuring characters from Final Fantasy series",
        },
        {
          title: "Star Wars: Unlimited",
          slug: "star-wars-unlimited",
          imageUrl: "https://picsum.photos/205",
          description: "Galactic battles from the Star Wars universe",
        },
        {
          title: "Lorcana",
          slug: "lorcana",
          imageUrl: "https://picsum.photos/206",
          description: "Disney's trading card game featuring beloved characters",
        },
        {
          title: "Weiss Schwarz",
          slug: "weiss-schwarz",
          imageUrl: "https://picsum.photos/207",
          description: "Anime and game character crossover TCG",
        },
        {
          title: "Shadowverse",
          slug: "shadowverse",
          imageUrl: "https://picsum.photos/208",
          description: "Strategic fantasy card game",
        },
        {
          title: "Legends of Runeterra",
          slug: "legends-of-runeterra",
          imageUrl: "https://picsum.photos/209",
          description: "Card game set in the League of Legends universe",
        },
        {
          title: "Hearthstone",
          slug: "hearthstone",
          imageUrl: "https://picsum.photos/210",
          description: "Blizzard's digital card game from Warcraft universe",
        },
        {
          title: "Gwent",
          slug: "gwent",
          imageUrl: "https://picsum.photos/211",
          description: "The Witcher card game of wits and strategy",
        },
        {
          title: "Marvel Snap",
          slug: "marvel-snap",
          imageUrl: "https://picsum.photos/212",
          description: "Fast-paced Marvel superhero card game",
        },
        {
          title: "Splinterlands",
          slug: "splinterlands",
          imageUrl: "https://picsum.photos/213",
          description: "Blockchain-based collectible card game",
        },
        {
          title: "Gods Unchained",
          slug: "gods-unchained",
          imageUrl: "https://picsum.photos/214",
          description: "Free-to-play tactical card game on blockchain",
        },
        {
          title: "Force of Will",
          slug: "force-of-will",
          imageUrl: "https://picsum.photos/215",
          description: "Fantasy TCG with diverse gameplay mechanics",
        },
        {
          title: "Weiß Schwarz",
          slug: "weiss-schwarz-jp",
          imageUrl: "https://picsum.photos/216",
          description: "Japanese version featuring exclusive anime series",
        },
        {
          title: "Battle Spirits",
          slug: "battle-spirits",
          imageUrl: "https://picsum.photos/217",
          description: "Japanese TCG with spirit summoning mechanics",
        },
        {
          title: "Duel Masters",
          slug: "duel-masters",
          imageUrl: "https://picsum.photos/218",
          description: "Popular Japanese trading card game",
        },
        {
          title: "Buddyfight",
          slug: "buddyfight",
          imageUrl: "https://picsum.photos/219",
          description: "Card game where you fight alongside your buddy monster",
        },
      ])
      .returning()

    console.log(`✓ Created ${categories.length} categories`)

    console.log("Creating items...")
    const items = await db
      .insert(schema.item)
      .values([
        {
          name: "Black Lotus",
          slug: "black-lotus",
          setName: "Alpha",
          rarity: "rare",
          price: "27999.99",
          imageUrl:
            "https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg",
          description: "The most iconic and valuable Magic card ever printed",
          stockQty: 1,
        },
        {
          name: "Lightning Bolt",
          slug: "lightning-bolt",
          setName: "Beta",
          rarity: "common",
          price: "49.99",
          imageUrl:
            "https://cards.scryfall.io/large/front/c/e/ce711943-c1a1-43a0-8b89-8d169cfb8e06.jpg",
          description: "Classic red instant dealing 3 damage",
          stockQty: 25,
        },
        {
          name: "Jace, the Mind Sculptor",
          slug: "jace-the-mind-sculptor",
          setName: "Worldwake",
          rarity: "mythic",
          price: "89.99",
          imageUrl:
            "https://cards.scryfall.io/large/front/c/0/c057dc0d-4017-4e60-9c5e-45fc569a8d31.jpg",
          description: "Powerful planeswalker with mind control abilities",
          stockQty: 12,
        },
        {
          name: "Sol Ring",
          slug: "sol-ring",
          setName: "Commander Legends",
          rarity: "uncommon",
          price: "2.99",
          imageUrl:
            "https://cards.scryfall.io/large/front/4/c/4cbc6901-6a4a-4d0a-83ea-7eefa3b35021.jpg",
          description: "Essential mana acceleration artifact",
          stockQty: 100,
        },
        {
          name: "Pikachu VMAX",
          slug: "pikachu-vmax",
          setName: "Vivid Voltage",
          rarity: "rare",
          price: "24.99",
          imageUrl: "https://images.pokemontcg.io/swsh4/44_hires.png",
          description: "Electric-type VMAX Pokemon with powerful attacks",
          stockQty: 30,
        },
        {
          name: "Charizard V",
          slug: "charizard-v",
          setName: "Brilliant Stars",
          rarity: "rare",
          price: "45.99",
          imageUrl: "https://images.pokemontcg.io/swsh9/17_hires.png",
          description: "Fan-favorite fire-flying type Pokemon",
          stockQty: 15,
        },
        {
          name: "Mewtwo GX",
          slug: "mewtwo-gx",
          setName: "Shining Legends",
          rarity: "ultra_rare",
          price: "34.99",
          imageUrl: "https://images.pokemontcg.io/sm35/72_hires.png",
          description: "Psychic-type legendary Pokemon with GX attack",
          stockQty: 20,
        },
        {
          name: "Professor's Research",
          slug: "professors-research",
          setName: "Sword & Shield",
          rarity: "uncommon",
          price: "1.99",
          imageUrl: "https://images.pokemontcg.io/swsh1/178_hires.png",
          description: "Essential draw supporter card",
          stockQty: 150,
        },
        {
          name: "Blue-Eyes White Dragon",
          slug: "blue-eyes-white-dragon",
          setName: "Legend of Blue Eyes",
          rarity: "ultra_rare",
          price: "149.99",
          imageUrl: "https://images.ygoprodeck.com/images/cards/89631139.jpg",
          description: "Kaiba's legendary dragon with 3000 ATK",
          stockQty: 8,
        },
        {
          name: "Dark Magician",
          slug: "dark-magician",
          setName: "Legendary Collection",
          rarity: "ultra_rare",
          price: "79.99",
          imageUrl: "https://images.ygoprodeck.com/images/cards/46986414.jpg",
          description: "Yugi's signature spellcaster monster",
          stockQty: 12,
        },
        {
          name: "Pot of Greed",
          slug: "pot-of-greed",
          setName: "Legend of Blue Eyes",
          rarity: "rare",
          price: "39.99",
          imageUrl: "https://images.ygoprodeck.com/images/cards/55144522.jpg",
          description: "Draw 2 cards - one of the most powerful spell cards",
          stockQty: 25,
        },
        {
          name: "Monkey D. Luffy Leader",
          slug: "monkey-d-luffy-leader",
          setName: "Romance Dawn",
          rarity: "leader",
          price: "19.99",
          imageUrl: "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003.png",
          description: "Straw Hat Pirates captain leader card",
          stockQty: 40,
        },
        {
          name: "Roronoa Zoro",
          slug: "roronoa-zoro",
          setName: "Romance Dawn",
          rarity: "super_rare",
          price: "29.99",
          imageUrl: "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-025.png",
          description: "Three-sword style swordsman",
          stockQty: 35,
        },
        {
          name: "Nami",
          slug: "nami",
          setName: "Pillars of Strength",
          rarity: "rare",
          price: "14.99",
          imageUrl: "https://en.onepiece-cardgame.com/images/cardlist/card/OP03-040.png",
          description: "Navigator of the Straw Hat crew",
          stockQty: 50,
        },
        {
          name: "Son Goku",
          slug: "son-goku",
          setName: "Colossal Warfare",
          rarity: "super_rare",
          price: "24.99",
          imageUrl: "https://www.dbs-cardgame.com/us-en/cardlist/img/BT3-091.png",
          description: "Super Saiyan warrior with incredible power",
          stockQty: 45,
        },
        {
          name: "Vegeta",
          slug: "vegeta",
          setName: "Union Force",
          rarity: "super_rare",
          price: "22.99",
          imageUrl: "https://www.dbs-cardgame.com/us-en/cardlist/img/BT2-024.png",
          description: "Proud Saiyan prince",
          stockQty: 38,
        },
        {
          name: "Beerus",
          slug: "beerus",
          setName: "Destroyer Kings",
          rarity: "secret_rare",
          price: "39.99",
          imageUrl: "https://www.dbs-cardgame.com/us-en/cardlist/img/BT6-080.png",
          description: "God of Destruction with overwhelming power",
          stockQty: 20,
        },
        {
          name: "Tarmogoyf",
          slug: "tarmogoyf",
          setName: "Modern Masters",
          rarity: "mythic",
          price: "45.99",
          imageUrl:
            "https://cards.scryfall.io/large/front/6/9/69daba76-96e8-4bcc-ab79-2f00189ad8fb.jpg",
          description: "Versatile creature that grows with graveyard",
          stockQty: 18,
        },
        {
          name: "Force of Will",
          slug: "force-of-will-card",
          setName: "Eternal Masters",
          rarity: "mythic",
          price: "79.99",
          imageUrl:
            "https://cards.scryfall.io/large/front/d/d/dd60b291-0a88-4e8e-bef8-76cdfd6c8183.jpg",
          description: "Free counterspell by exiling blue card",
          stockQty: 15,
        },
        {
          name: "Mox Opal",
          slug: "mox-opal",
          setName: "Scars of Mirrodin",
          rarity: "mythic",
          price: "159.99",
          imageUrl:
            "https://cards.scryfall.io/large/front/5/6/56001a36-126b-4c08-af98-a6cc4d84210e.jpg",
          description: "Zero-cost artifact for metalcraft decks",
          stockQty: 6,
        },
        {
          name: "Snapcaster Mage",
          slug: "snapcaster-mage",
          setName: "Innistrad",
          rarity: "rare",
          price: "54.99",
          imageUrl:
            "https://cards.scryfall.io/large/front/7/e/7e41765e-43fe-461d-baeb-ee30d13d2d93.jpg",
          description: "Flash creature that gives instants/sorceries flashback",
          stockQty: 22,
        },
        {
          name: "Eevee VMAX",
          slug: "eevee-vmax",
          setName: "Evolving Skies",
          rarity: "rare",
          price: "39.99",
          imageUrl: "https://images.pokemontcg.io/swsh7/188_hires.png",
          description: "Evolution Pokemon with adaptable attacks",
          stockQty: 25,
        },
        {
          name: "Rayquaza VMAX",
          slug: "rayquaza-vmax",
          setName: "Evolving Skies",
          rarity: "secret_rare",
          price: "89.99",
          imageUrl: "https://images.pokemontcg.io/swsh7/218_hires.png",
          description: "Legendary dragon Pokemon with massive power",
          stockQty: 10,
        },
        {
          name: "Umbreon VMAX",
          slug: "umbreon-vmax",
          setName: "Evolving Skies",
          rarity: "rare",
          price: "119.99",
          imageUrl: "https://images.pokemontcg.io/swsh7/215_hires.png",
          description: "Dark-type Eeveelution with high HP",
          stockQty: 8,
        },
        {
          name: "Boss's Orders",
          slug: "bosss-orders",
          setName: "Rebel Clash",
          rarity: "uncommon",
          price: "3.99",
          imageUrl: "https://images.pokemontcg.io/swsh2/154_hires.png",
          description: "Switch opponent's active Pokemon",
          stockQty: 120,
        },
        {
          name: "Exodia the Forbidden One",
          slug: "exodia-the-forbidden-one",
          setName: "Legend of Blue Eyes",
          rarity: "ultra_rare",
          price: "299.99",
          imageUrl: "https://images.ygoprodeck.com/images/cards/33396948.jpg",
          description: "Instant win condition with all five pieces",
          stockQty: 3,
        },
        {
          name: "Red-Eyes Black Dragon",
          slug: "red-eyes-black-dragon",
          setName: "Legendary Decks II",
          rarity: "ultra_rare",
          price: "34.99",
          imageUrl: "https://images.ygoprodeck.com/images/cards/74677422.jpg",
          description: "Joey's signature dragon with 2400 ATK",
          stockQty: 15,
        },
        {
          name: "Monster Reborn",
          slug: "monster-reborn",
          setName: "Legendary Collection",
          rarity: "rare",
          price: "24.99",
          imageUrl: "https://images.ygoprodeck.com/images/cards/83764718.jpg",
          description: "Revive any monster from either graveyard",
          stockQty: 30,
        },
        {
          name: "Mirror Force",
          slug: "mirror-force",
          setName: "Metal Raiders",
          rarity: "ultra_rare",
          price: "19.99",
          imageUrl: "https://images.ygoprodeck.com/images/cards/44095762.jpg",
          description: "Destroy all opponent's attack position monsters",
          stockQty: 40,
        },
        {
          name: "Trafalgar Law",
          slug: "trafalgar-law",
          setName: "Paramount War",
          rarity: "super_rare",
          price: "34.99",
          imageUrl: "https://en.onepiece-cardgame.com/images/cardlist/card/OP02-041.png",
          description: "Surgeon of Death with tactical abilities",
          stockQty: 28,
        },
        {
          name: "Portgas D. Ace",
          slug: "portgas-d-ace",
          setName: "Romance Dawn",
          rarity: "super_rare",
          price: "39.99",
          imageUrl: "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-013.png",
          description: "Fire Fist Ace with flame powers",
          stockQty: 22,
        },
        {
          name: "Shanks",
          slug: "shanks",
          setName: "Wings of Captain",
          rarity: "secret_rare",
          price: "79.99",
          imageUrl: "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-120.png",
          description: "Red-Haired Emperor of the Sea",
          stockQty: 12,
        },
        {
          name: "Vegito",
          slug: "vegito",
          setName: "Assault of the Saiyans",
          rarity: "special_rare",
          price: "44.99",
          imageUrl: "https://www.dbs-cardgame.com/us-en/cardlist/img/BT7-014.png",
          description: "Potara fusion of Goku and Vegeta",
          stockQty: 26,
        },
        {
          name: "Gohan",
          slug: "gohan",
          setName: "Ultimate Box",
          rarity: "super_rare",
          price: "29.99",
          imageUrl: "https://www.dbs-cardgame.com/us-en/cardlist/img/BT5-028.png",
          description: "Ultimate Gohan with hidden potential",
          stockQty: 32,
        },
        {
          name: "Frieza",
          slug: "frieza",
          setName: "Galactic Battle",
          rarity: "super_rare",
          price: "27.99",
          imageUrl: "https://www.dbs-cardgame.com/us-en/cardlist/img/BT1-072.png",
          description: "Emperor of the Universe in golden form",
          stockQty: 35,
        },
      ])
      .returning()

    console.log(`✓ Created ${items.length} items`)

    console.log("Creating item-category associations...")
    await db.insert(schema.itemCategory).values([
      // Magic: The Gathering (categories[0])
      { itemId: items[0].id, categoryId: categories[0].id },
      { itemId: items[1].id, categoryId: categories[0].id },
      { itemId: items[2].id, categoryId: categories[0].id },
      { itemId: items[3].id, categoryId: categories[0].id },
      { itemId: items[17].id, categoryId: categories[0].id },
      { itemId: items[18].id, categoryId: categories[0].id },
      { itemId: items[19].id, categoryId: categories[0].id },
      { itemId: items[20].id, categoryId: categories[0].id },
      // Pokemon (categories[1])
      { itemId: items[4].id, categoryId: categories[1].id },
      { itemId: items[5].id, categoryId: categories[1].id },
      { itemId: items[6].id, categoryId: categories[1].id },
      { itemId: items[7].id, categoryId: categories[1].id },
      { itemId: items[21].id, categoryId: categories[1].id },
      { itemId: items[22].id, categoryId: categories[1].id },
      { itemId: items[23].id, categoryId: categories[1].id },
      { itemId: items[24].id, categoryId: categories[1].id },
      // Yu-Gi-Oh! (categories[2])
      { itemId: items[8].id, categoryId: categories[2].id },
      { itemId: items[9].id, categoryId: categories[2].id },
      { itemId: items[10].id, categoryId: categories[2].id },
      { itemId: items[25].id, categoryId: categories[2].id },
      { itemId: items[26].id, categoryId: categories[2].id },
      { itemId: items[27].id, categoryId: categories[2].id },
      { itemId: items[28].id, categoryId: categories[2].id },
      // One Piece (categories[3])
      { itemId: items[11].id, categoryId: categories[3].id },
      { itemId: items[12].id, categoryId: categories[3].id },
      { itemId: items[13].id, categoryId: categories[3].id },
      { itemId: items[29].id, categoryId: categories[3].id },
      { itemId: items[30].id, categoryId: categories[3].id },
      { itemId: items[31].id, categoryId: categories[3].id },
      // Dragon Ball (categories[4])
      { itemId: items[14].id, categoryId: categories[4].id },
      { itemId: items[15].id, categoryId: categories[4].id },
      { itemId: items[16].id, categoryId: categories[4].id },
      { itemId: items[32].id, categoryId: categories[4].id },
      { itemId: items[33].id, categoryId: categories[4].id },
      { itemId: items[34].id, categoryId: categories[4].id },
    ])

    console.log("✓ Created item-category associations")

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
