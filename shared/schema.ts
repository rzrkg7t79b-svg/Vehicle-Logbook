
import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  initials: text("initials").notNull(),
  pin: text("pin").notNull().unique(),
  roles: text("roles").array().notNull().default([]),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  licensePlate: text("license_plate").notNull(),
  name: text("name"), // Model or name
  notes: text("notes"), // Initial notes
  isEv: boolean("is_ev").default(false).notNull(),
  readyForCollection: boolean("ready_for_collection").default(false).notNull(),
  countdownStart: timestamp("countdown_start").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  content: text("content").notNull(),
  userInitials: text("user_initials"),
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

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .extend({
    initials: z.string().min(1).max(3).toUpperCase(),
    pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
    roles: z.array(z.enum(["Counter", "Driver"])).default([]),
    isAdmin: z.boolean().default(false),
  });

export const insertVehicleSchema = createInsertSchema(vehicles)
  .omit({ id: true, createdAt: true })
  .extend({
    countdownStart: z.coerce.date(),
  });

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type CreateUserRequest = InsertUser;
export type CreateVehicleRequest = InsertVehicle;
export type CreateCommentRequest = InsertComment;
