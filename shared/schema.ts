
import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  licensePlate: text("license_plate").notNull(),
  name: text("name"), // Model or name
  notes: text("notes"), // Initial notes
  isEv: boolean("is_ev").default(false).notNull(),
  countdownStart: timestamp("countdown_start").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [comments.vehicleId],
    references: [vehicles.id],
  }),
}));

export const insertVehicleSchema = createInsertSchema(vehicles)
  .omit({ id: true, createdAt: true })
  .extend({
    countdownStart: z.coerce.date(), // Ensure date coercion from string/number
  });

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type CreateVehicleRequest = InsertVehicle;
export type CreateCommentRequest = InsertComment;
