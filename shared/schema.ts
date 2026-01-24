
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

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedBy: text("completed_by"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const qualityChecks = pgTable("quality_checks", {
  id: serial("id").primaryKey(),
  licensePlate: text("license_plate").notNull(),
  passed: boolean("passed").notNull(),
  comment: text("comment"),
  checkedBy: text("checked_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const driverTasks = pgTable("driver_tasks", {
  id: serial("id").primaryKey(),
  qualityCheckId: integer("quality_check_id").references(() => qualityChecks.id, { onDelete: 'cascade' }).notNull(),
  licensePlate: text("license_plate").notNull(),
  description: text("description").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedBy: text("completed_by"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const moduleStatus = pgTable("module_status", {
  id: serial("id").primaryKey(),
  moduleName: text("module_name").notNull().unique(),
  isDone: boolean("is_done").default(false).notNull(),
  doneAt: timestamp("done_at"),
  doneBy: text("done_by"),
  date: text("date").notNull(),
});

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

export const insertTodoSchema = createInsertSchema(todos)
  .omit({ id: true, createdAt: true, completedAt: true })
  .extend({
    title: z.string().min(1, "Title is required"),
    completed: z.boolean().default(false),
    completedBy: z.string().optional(),
  });

export const insertQualityCheckSchema = createInsertSchema(qualityChecks)
  .omit({ id: true, createdAt: true })
  .extend({
    licensePlate: z.string().min(1, "License plate is required"),
    passed: z.boolean(),
    comment: z.string().optional(),
    checkedBy: z.string().optional(),
  });

export const insertDriverTaskSchema = createInsertSchema(driverTasks)
  .omit({ id: true, createdAt: true, completedAt: true });

export const insertModuleStatusSchema = createInsertSchema(moduleStatus)
  .omit({ id: true, doneAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Todo = typeof todos.$inferSelect;
export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type QualityCheck = typeof qualityChecks.$inferSelect;
export type InsertQualityCheck = z.infer<typeof insertQualityCheckSchema>;
export type DriverTask = typeof driverTasks.$inferSelect;
export type InsertDriverTask = z.infer<typeof insertDriverTaskSchema>;
export type ModuleStatus = typeof moduleStatus.$inferSelect;
export type InsertModuleStatus = z.infer<typeof insertModuleStatusSchema>;

export type CreateUserRequest = InsertUser;
export type CreateVehicleRequest = InsertVehicle;
export type CreateCommentRequest = InsertComment;
