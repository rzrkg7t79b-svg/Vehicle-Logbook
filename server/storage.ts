
import { db } from "./db";
import {
  vehicles,
  comments,
  type InsertVehicle,
  type InsertComment,
  type Vehicle,
  type Comment
} from "@shared/schema";
import { eq, desc, asc, lte, and, sql } from "drizzle-orm";

export interface IStorage {
  getVehicles(filter?: 'all' | 'expired', search?: string): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleWithComments(id: number): Promise<(Vehicle & { comments: Comment[] }) | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, data: Partial<Vehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<void>;
  createComment(comment: InsertComment): Promise<Comment>;
  getComments(vehicleId: number): Promise<Comment[]>;
}

export class DatabaseStorage implements IStorage {
  async getVehicles(filter: 'all' | 'expired' = 'all', search?: string): Promise<Vehicle[]> {
    let query = db.select().from(vehicles);
    const conditions = [];

    if (search) {
      conditions.push(sql`${vehicles.licensePlate} ILIKE ${`%${search}%`}`);
    }

    if (filter === 'expired') {
      // Logic for expired: countdownStart + 7 days < now
      // This is a bit complex in SQL directly without raw query or helper,
      // simplifying to return all and filter in app or standard query if possible.
      // For now, let's just return all and let frontend sort/filter visuals,
      // or implement basic DB filter.
      // PostGres interval:
      conditions.push(sql`${vehicles.countdownStart} + interval '7 days' < NOW()`);
    }

    if (conditions.length > 0) {
        // @ts-ignore
        query = query.where(and(...conditions));
    }

    // Sort by countdown end date (created + 7 days) ascending (soonest first)
    return await query.orderBy(asc(vehicles.countdownStart));
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async getVehicleWithComments(id: number): Promise<(Vehicle & { comments: Comment[] }) | undefined> {
    const vehicle = await this.getVehicle(id);
    if (!vehicle) return undefined;

    const vehicleComments = await this.getComments(id);
    return { ...vehicle, comments: vehicleComments };
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateVehicle(id: number, data: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const [updated] = await db.update(vehicles).set(data).where(eq(vehicles.id, id)).returning();
    return updated;
  }

  async deleteVehicle(id: number): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getComments(vehicleId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.vehicleId, vehicleId))
      .orderBy(desc(comments.createdAt));
  }
}

export const storage = new DatabaseStorage();
