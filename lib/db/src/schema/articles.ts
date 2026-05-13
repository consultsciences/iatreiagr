import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";

export const articlesTable = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  image_url: text("image_url"),
  read_time: text("read_time").notNull().default("5 λεπτά"),
  author: text("author").notNull().default("Σύνταξη iatreia.gr"),
  published: boolean("published").notNull().default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export type Article = typeof articlesTable.$inferSelect;
export type NewArticle = typeof articlesTable.$inferInsert;
