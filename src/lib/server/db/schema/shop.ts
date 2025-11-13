import { index, integer, numeric, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

import { user } from "./auth"

export const category = pgTable(
  "category",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull().unique(),
    imageUrl: text("image_url"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    titleIdx: uniqueIndex("category_title_idx").on(table.title),
  }),
)

export const item = pgTable(
  "item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    setName: text("set_name"),
    rarity: text("rarity"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    imageUrl: text("image_url"),
    description: text("description"),
    stockQty: integer("stock_qty").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    setNameIdx: index("item_set_name_idx").on(table.setName),
    rarityIdx: index("item_rarity_idx").on(table.rarity),
  }),
)

export const itemCategory = pgTable(
  "item_category",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    itemId: text("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    itemCategoryUnique: uniqueIndex("item_category_unique_idx").on(table.itemId, table.categoryId),
    itemIdx: index("item_category_item_idx").on(table.itemId),
    categoryIdx: index("item_category_category_idx").on(table.categoryId),
  }),
)

export const cartItem = pgTable(
  "cart_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    itemId: text("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userItemIdx: uniqueIndex("cart_item_user_item_idx").on(table.userId, table.itemId),
  }),
)

export const order = pgTable(
  "order",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdx: index("order_user_idx").on(table.userId),
    createdAtIdx: index("order_created_at_idx").on(table.createdAt),
  }),
)

export const orderItem = pgTable("order_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  itemId: text("item_id")
    .notNull()
    .references(() => item.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  priceAtTime: numeric("price_at_time", { precision: 10, scale: 2 }).notNull(),
})
