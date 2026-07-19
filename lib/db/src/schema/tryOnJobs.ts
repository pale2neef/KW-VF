import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tryOnJobsTable = pgTable("try_on_jobs", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("pending"),
  resultImageUrl: text("result_image_url"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTryOnJobSchema = createInsertSchema(tryOnJobsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertTryOnJob = z.infer<typeof insertTryOnJobSchema>;
export type TryOnJob = typeof tryOnJobsTable.$inferSelect;
