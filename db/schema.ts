import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const therapists = sqliteTable("therapists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  bio: text("bio").notNull(),
  imageUrl: text("image_url"),
  status: text("status", { enum: ["PENDING", "APPROVED", "REJECTED"] }).default("PENDING").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  contactMethod: text("contact_method", { enum: ["email", "whatsapp"] }).notNull(),
  contactValue: text("contact_value").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const selfTests = sqliteTable("self_tests", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  questions: text("questions", { mode: "json" }).notNull(), // JSON string for flexibility
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});
