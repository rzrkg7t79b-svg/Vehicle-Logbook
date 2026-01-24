
import { db } from "./db";
import {
  vehicles,
  comments,
  users,
  type InsertVehicle,
  type InsertComment,
  type InsertUser,
  type Vehicle,
  type Comment,
  type User
} from "@shared/schema";
import { eq, desc, asc, lte, and, sql, ne } from "drizzle-orm";

export interface IStorage {
  getVehicles(filter?: 'all' | 'expired', search?: string): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleWithComments(id: number): Promise<(Vehicle & { comments: Comment[] }) | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, data: Partial<Vehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<void>;
  createComment(comment: InsertComment): Promise<Comment>;
  getComments(vehicleId: number): Promise<Comment[]>;
  
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByPin(pin: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  isPinUnique(pin: string, excludeId?: number): Promise<boolean>;
  seedBranchManager(): Promise<void>;
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

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.initials));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPin(pin: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.pin, pin));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async isPinUnique(pin: string, excludeId?: number): Promise<boolean> {
    let query = db.select().from(users).where(eq(users.pin, pin));
    if (excludeId) {
      query = db.select().from(users).where(and(eq(users.pin, pin), ne(users.id, excludeId)));
    }
    const existing = await query;
    return existing.length === 0;
  }

  async seedBranchManager(): Promise<void> {
    const existing = await this.getUserByPin("4266");
    if (!existing) {
      await this.createUser({
        initials: "BM",
        pin: "4266",
        roles: ["Counter", "Driver"],
        isAdmin: true,
      });
      console.log("Branch Manager seeded with PIN 4266");
    }
  }
}

export const storage = new DatabaseStorage();
