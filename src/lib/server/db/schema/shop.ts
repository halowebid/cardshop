import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { user } from "./auth"

export const category = pgTable(
  "category",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull().unique(),
    slug: text("slug").notNull().unique(),
    imageUrl: text("image_url"),
    description: text("description"),
    status: text("status").notNull().default("active"),
    visibility: boolean("visibility").notNull().default(true),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    uploadedImageId: text("uploaded_image_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    titleIdx: uniqueIndex("category_title_idx").on(table.title),
    slugIdx: uniqueIndex("category_slug_idx").on(table.slug),
    updatedAtIdx: index("category_updated_at_idx").on(table.updatedAt),
  }),
)

export const rarity = pgTable(
  "rarity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    color: text("color"),
    status: text("status").notNull().default("active"),
    visibility: boolean("visibility").notNull().default(true),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    imageUrl: text("image_url"),
    uploadedImageId: text("uploaded_image_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("rarity_name_idx").on(table.name),
    slugIdx: uniqueIndex("rarity_slug_idx").on(table.slug),
    statusIdx: index("rarity_status_idx").on(table.status),
    updatedAtIdx: index("rarity_updated_at_idx").on(table.updatedAt),
  }),
)

export const tag = pgTable(
  "tag",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    status: text("status").notNull().default("active"),
    visibility: boolean("visibility").notNull().default(true),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("tag_name_idx").on(table.name),
    slugIdx: uniqueIndex("tag_slug_idx").on(table.slug),
    statusIdx: index("tag_status_idx").on(table.status),
    updatedAtIdx: index("tag_updated_at_idx").on(table.updatedAt),
  }),
)

export const item = pgTable(
  "item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    setName: text("set_name"),
    // New relational field
    rarityId: text("rarity_id").references(() => rarity.id, { onDelete: "set null" }),
    // Keep old fields for migration (will be dropped later)
    rarity: text("rarity"),
    tags: text("tags").array(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    imageUrl: text("image_url"),
    description: text("description"),
    stockQty: integer("stock_qty").default(0).notNull(),
    status: text("status").notNull().default("active"),
    visibility: boolean("visibility").notNull().default(true),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    uploadedImageId: text("uploaded_image_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    setNameIdx: index("item_set_name_idx").on(table.setName),
    rarityIdIdx: index("item_rarity_id_idx").on(table.rarityId),
    rarityIdx: index("item_rarity_idx").on(table.rarity),
    slugIdx: uniqueIndex("item_slug_idx").on(table.slug),
    updatedAtIdx: index("item_updated_at_idx").on(table.updatedAt),
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

export const itemTag = pgTable(
  "item_tag",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    itemId: text("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    itemTagUnique: uniqueIndex("item_tag_unique_idx").on(table.itemId, table.tagId),
    itemIdx: index("item_tag_item_idx").on(table.itemId),
    tagIdx: index("item_tag_tag_idx").on(table.tagId),
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
    updatedAtIdx: index("order_updated_at_idx").on(table.updatedAt),
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

// Relations
export const rarityRelations = relations(rarity, ({ many }) => ({
  items: many(item),
}))

export const tagRelations = relations(tag, ({ many }) => ({
  itemTags: many(itemTag),
}))

export const itemRelations = relations(item, ({ one, many }) => ({
  rarity: one(rarity, {
    fields: [item.rarityId],
    references: [rarity.id],
  }),
  itemCategories: many(itemCategory),
  itemTags: many(itemTag),
  cartItems: many(cartItem),
  orderItems: many(orderItem),
}))

export const itemTagRelations = relations(itemTag, ({ one }) => ({
  item: one(item, {
    fields: [itemTag.itemId],
    references: [item.id],
  }),
  tag: one(tag, {
    fields: [itemTag.tagId],
    references: [tag.id],
  }),
}))

export const categoryRelations = relations(category, ({ many }) => ({
  itemCategories: many(itemCategory),
}))

export const itemCategoryRelations = relations(itemCategory, ({ one }) => ({
  item: one(item, {
    fields: [itemCategory.itemId],
    references: [item.id],
  }),
  category: one(category, {
    fields: [itemCategory.categoryId],
    references: [category.id],
  }),
}))

export const cartItemRelations = relations(cartItem, ({ one }) => ({
  user: one(user, {
    fields: [cartItem.userId],
    references: [user.id],
  }),
  item: one(item, {
    fields: [cartItem.itemId],
    references: [item.id],
  }),
}))

export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
  orderItems: many(orderItem),
}))

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  item: one(item, {
    fields: [orderItem.itemId],
    references: [item.id],
  }),
}))
