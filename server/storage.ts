
import { db } from "./db";
import {
  vehicles,
  comments,
  users,
  todos,
  qualityChecks,
  driverTasks,
  flowTasks,
  moduleStatus,
  appSettings,
  timedriverCalculations,
  vehicleComments,
  upgradeVehicles,
  futurePlanning,
  type InsertVehicle,
  type InsertComment,
  type InsertUser,
  type InsertTodo,
  type InsertQualityCheck,
  type InsertDriverTask,
  type InsertFlowTask,
  type InsertModuleStatus,
  type InsertTimedriverCalculation,
  type InsertUpgradeVehicle,
  type InsertFuturePlanning,
  type Vehicle,
  type Comment,
  type User,
  type Todo,
  type QualityCheck,
  type DriverTask,
  type FlowTask,
  type ModuleStatus,
  type AppSettings,
  type TimedriverCalculation,
  type VehicleDailyComment,
  type UpgradeVehicle,
  type FuturePlanning,
} from "@shared/schema";
import { eq, desc, asc, lte, and, sql, ne, inArray, gte } from "drizzle-orm";

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

  getTodos(): Promise<Todo[]>;
  getTodo(id: number): Promise<Todo | undefined>;
  createTodo(todo: InsertTodo): Promise<Todo>;
  updateTodo(id: number, data: Partial<Todo>): Promise<Todo | undefined>;
  deleteTodo(id: number): Promise<void>;

  getQualityChecks(): Promise<QualityCheck[]>;
  getQualityCheck(id: number): Promise<QualityCheck | undefined>;
  createQualityCheck(check: InsertQualityCheck): Promise<QualityCheck>;

  getDriverTasks(): Promise<DriverTask[]>;
  getDriverTask(id: number): Promise<DriverTask | undefined>;
  createDriverTask(task: InsertDriverTask): Promise<DriverTask>;
  updateDriverTask(id: number, data: Partial<DriverTask>): Promise<DriverTask | undefined>;

  getModuleStatus(date: string): Promise<ModuleStatus[]>;
  setModuleStatus(moduleName: string, date: string, isDone: boolean, doneBy?: string): Promise<ModuleStatus>;

  getFlowTasks(): Promise<FlowTask[]>;
  getFlowTask(id: number): Promise<FlowTask | undefined>;
  createFlowTask(task: InsertFlowTask): Promise<FlowTask>;
  updateFlowTask(id: number, data: Partial<FlowTask>): Promise<FlowTask | undefined>;
  deleteFlowTask(id: number): Promise<void>;
  reorderFlowTasks(taskIds: number[]): Promise<void>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<AppSettings>;

  getTimedriverCalculation(date: string): Promise<TimedriverCalculation | undefined>;
  saveTimedriverCalculation(calc: InsertTimedriverCalculation): Promise<TimedriverCalculation>;
  deleteTimedriverCalculationForDate(date: string): Promise<void>;

  getVehicleDailyComment(vehicleId: number, date: string): Promise<VehicleDailyComment | undefined>;
  setVehicleDailyComment(vehicleId: number, date: string, commentId: number): Promise<VehicleDailyComment>;
  getVehiclesWithoutDailyComment(date: string): Promise<Vehicle[]>;
  
  getQualityChecksForDate(date: string): Promise<QualityCheck[]>;
  getIncompleteDriverTasks(): Promise<DriverTask[]>;
  getTodosForCounter(): Promise<Todo[]>;

  getUpgradeVehicles(): Promise<UpgradeVehicle[]>;
  getUpgradeVehiclesForDate(date: string): Promise<UpgradeVehicle[]>;
  getUpgradeVehicle(id: number): Promise<UpgradeVehicle | undefined>;
  createUpgradeVehicle(vehicle: InsertUpgradeVehicle): Promise<UpgradeVehicle>;
  updateUpgradeVehicle(id: number, data: Partial<UpgradeVehicle>): Promise<UpgradeVehicle | undefined>;
  deleteUpgradeVehicle(id: number): Promise<void>;
  getPendingUpgradeVehicle(date: string): Promise<UpgradeVehicle | undefined>;
  getPendingUpgradeVehicles(date: string): Promise<UpgradeVehicle[]>;

  getFuturePlanning(date: string): Promise<FuturePlanning | undefined>;
  saveFuturePlanning(data: InsertFuturePlanning): Promise<FuturePlanning>;
  deleteFuturePlanning(date: string): Promise<void>;

  performMidnightReset(): Promise<void>;
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

  async getTodos(): Promise<Todo[]> {
    return await db.select().from(todos).orderBy(asc(todos.createdAt));
  }

  async getTodo(id: number): Promise<Todo | undefined> {
    const [todo] = await db.select().from(todos).where(eq(todos.id, id));
    return todo;
  }

  async createTodo(todo: InsertTodo): Promise<Todo> {
    const [newTodo] = await db.insert(todos).values(todo).returning();
    return newTodo;
  }

  async updateTodo(id: number, data: Partial<Todo>): Promise<Todo | undefined> {
    const [updated] = await db.update(todos).set(data).where(eq(todos.id, id)).returning();
    return updated;
  }

  async deleteTodo(id: number): Promise<void> {
    await db.delete(todos).where(eq(todos.id, id));
  }

  async getQualityChecks(): Promise<QualityCheck[]> {
    return await db.select().from(qualityChecks).orderBy(desc(qualityChecks.createdAt));
  }

  async getQualityCheck(id: number): Promise<QualityCheck | undefined> {
    const [check] = await db.select().from(qualityChecks).where(eq(qualityChecks.id, id));
    return check;
  }

  async createQualityCheck(check: InsertQualityCheck): Promise<QualityCheck> {
    const [newCheck] = await db.insert(qualityChecks).values(check).returning();
    return newCheck;
  }

  async getDriverTasks(): Promise<DriverTask[]> {
    return await db.select().from(driverTasks).orderBy(desc(driverTasks.createdAt));
  }

  async getDriverTask(id: number): Promise<DriverTask | undefined> {
    const [task] = await db.select().from(driverTasks).where(eq(driverTasks.id, id));
    return task;
  }

  async createDriverTask(task: InsertDriverTask): Promise<DriverTask> {
    const [newTask] = await db.insert(driverTasks).values(task).returning();
    return newTask;
  }

  async updateDriverTask(id: number, data: Partial<DriverTask>): Promise<DriverTask | undefined> {
    const [updated] = await db.update(driverTasks).set(data).where(eq(driverTasks.id, id)).returning();
    return updated;
  }

  async getModuleStatus(date: string): Promise<ModuleStatus[]> {
    return await db.select().from(moduleStatus).where(eq(moduleStatus.date, date));
  }

  async setModuleStatus(moduleName: string, date: string, isDone: boolean, doneBy?: string): Promise<ModuleStatus> {
    const existing = await db.select().from(moduleStatus).where(
      and(eq(moduleStatus.moduleName, moduleName), eq(moduleStatus.date, date))
    );
    
    if (existing.length > 0) {
      const [updated] = await db.update(moduleStatus)
        .set({ isDone, doneBy, doneAt: isDone ? new Date() : null })
        .where(and(eq(moduleStatus.moduleName, moduleName), eq(moduleStatus.date, date)))
        .returning();
      return updated;
    }
    
    const [newStatus] = await db.insert(moduleStatus).values({
      moduleName,
      date,
      isDone,
      doneBy,
      doneAt: isDone ? new Date() : null,
    }).returning();
    return newStatus;
  }

  async getFlowTasks(): Promise<FlowTask[]> {
    return await db.select().from(flowTasks).orderBy(asc(flowTasks.priority), desc(flowTasks.createdAt));
  }

  async getFlowTask(id: number): Promise<FlowTask | undefined> {
    const [task] = await db.select().from(flowTasks).where(eq(flowTasks.id, id));
    return task;
  }

  async createFlowTask(task: InsertFlowTask): Promise<FlowTask> {
    const allTasks = await this.getFlowTasks();
    const maxPriority = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.priority)) : 0;
    const [newTask] = await db.insert(flowTasks).values({ ...task, priority: maxPriority + 1 }).returning();
    return newTask;
  }

  async updateFlowTask(id: number, data: Partial<FlowTask>): Promise<FlowTask | undefined> {
    const [updated] = await db.update(flowTasks).set(data).where(eq(flowTasks.id, id)).returning();
    return updated;
  }

  async deleteFlowTask(id: number): Promise<void> {
    await db.delete(flowTasks).where(eq(flowTasks.id, id));
  }

  async reorderFlowTasks(taskIds: number[]): Promise<void> {
    for (let i = 0; i < taskIds.length; i++) {
      await db.update(flowTasks).set({ priority: i + 1 }).where(eq(flowTasks.id, taskIds[i]));
    }
  }

  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<AppSettings> {
    const existing = await db.select().from(appSettings).where(eq(appSettings.key, key));
    
    if (existing.length > 0) {
      const [updated] = await db.update(appSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(appSettings.key, key))
        .returning();
      return updated;
    }
    
    const [newSetting] = await db.insert(appSettings).values({
      key,
      value,
    }).returning();
    return newSetting;
  }

  async getTimedriverCalculation(date: string): Promise<TimedriverCalculation | undefined> {
    const [calc] = await db.select().from(timedriverCalculations).where(eq(timedriverCalculations.date, date));
    return calc;
  }

  async saveTimedriverCalculation(calc: InsertTimedriverCalculation): Promise<TimedriverCalculation> {
    const existing = await this.getTimedriverCalculation(calc.date);
    if (existing) {
      const [updated] = await db.update(timedriverCalculations)
        .set(calc)
        .where(eq(timedriverCalculations.date, calc.date))
        .returning();
      return updated;
    }
    const [newCalc] = await db.insert(timedriverCalculations).values(calc).returning();
    return newCalc;
  }

  async deleteTimedriverCalculationForDate(date: string): Promise<void> {
    await db.delete(timedriverCalculations).where(eq(timedriverCalculations.date, date));
  }

  async getVehicleDailyComment(vehicleId: number, date: string): Promise<VehicleDailyComment | undefined> {
    const [record] = await db.select().from(vehicleComments)
      .where(and(eq(vehicleComments.vehicleId, vehicleId), eq(vehicleComments.date, date)));
    return record;
  }

  async setVehicleDailyComment(vehicleId: number, date: string, commentId: number): Promise<VehicleDailyComment> {
    const existing = await this.getVehicleDailyComment(vehicleId, date);
    if (existing) {
      const [updated] = await db.update(vehicleComments)
        .set({ hasComment: true, commentId })
        .where(eq(vehicleComments.id, existing.id))
        .returning();
      return updated;
    }
    const [newRecord] = await db.insert(vehicleComments).values({
      vehicleId,
      date,
      hasComment: true,
      commentId,
    }).returning();
    return newRecord;
  }

  async getVehiclesWithoutDailyComment(date: string): Promise<Vehicle[]> {
    const allVehicles = await this.getVehicles();
    const activeVehicles = allVehicles.filter(v => !v.isPast);
    
    const result: Vehicle[] = [];
    for (const vehicle of activeVehicles) {
      const comment = await this.getVehicleDailyComment(vehicle.id, date);
      if (!comment || !comment.hasComment) {
        result.push(vehicle);
      }
    }
    return result;
  }

  async getQualityChecksForDate(date: string): Promise<QualityCheck[]> {
    const allChecks = await db.select().from(qualityChecks).orderBy(desc(qualityChecks.createdAt));
    return allChecks.filter(check => {
      if (!check.createdAt) return false;
      const checkDate = check.createdAt.toISOString().split('T')[0];
      return checkDate === date;
    });
  }

  async getIncompleteDriverTasks(): Promise<DriverTask[]> {
    return await db.select().from(driverTasks).where(eq(driverTasks.completed, false));
  }

  async getTodosForCounter(): Promise<Todo[]> {
    const allTodos = await this.getTodos();
    return allTodos.filter(todo => todo.assignedTo.includes('Counter'));
  }

  async getUpgradeVehicles(): Promise<UpgradeVehicle[]> {
    return db.select().from(upgradeVehicles).orderBy(desc(upgradeVehicles.createdAt));
  }

  async getUpgradeVehiclesForDate(date: string): Promise<UpgradeVehicle[]> {
    return db.select().from(upgradeVehicles).where(eq(upgradeVehicles.date, date)).orderBy(desc(upgradeVehicles.createdAt));
  }

  async getUpgradeVehicle(id: number): Promise<UpgradeVehicle | undefined> {
    const [vehicle] = await db.select().from(upgradeVehicles).where(eq(upgradeVehicles.id, id));
    return vehicle;
  }

  async createUpgradeVehicle(vehicle: InsertUpgradeVehicle): Promise<UpgradeVehicle> {
    const [newVehicle] = await db.insert(upgradeVehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateUpgradeVehicle(id: number, data: Partial<UpgradeVehicle>): Promise<UpgradeVehicle | undefined> {
    const [updated] = await db.update(upgradeVehicles).set(data).where(eq(upgradeVehicles.id, id)).returning();
    return updated;
  }

  async deleteUpgradeVehicle(id: number): Promise<void> {
    await db.delete(upgradeVehicles).where(eq(upgradeVehicles.id, id));
  }

  async getPendingUpgradeVehicle(date: string): Promise<UpgradeVehicle | undefined> {
    const [vehicle] = await db.select().from(upgradeVehicles)
      .where(and(eq(upgradeVehicles.date, date), eq(upgradeVehicles.isSold, false)))
      .orderBy(desc(upgradeVehicles.createdAt))
      .limit(1);
    return vehicle;
  }

  async getPendingUpgradeVehicles(date: string): Promise<UpgradeVehicle[]> {
    return db.select().from(upgradeVehicles)
      .where(and(eq(upgradeVehicles.date, date), eq(upgradeVehicles.isSold, false)))
      .orderBy(desc(upgradeVehicles.createdAt));
  }

  async getFuturePlanning(date: string): Promise<FuturePlanning | undefined> {
    const [planning] = await db.select().from(futurePlanning).where(eq(futurePlanning.date, date));
    return planning;
  }

  async saveFuturePlanning(data: InsertFuturePlanning): Promise<FuturePlanning> {
    const existing = await this.getFuturePlanning(data.date);
    if (existing) {
      const [updated] = await db.update(futurePlanning)
        .set({ ...data, savedAt: new Date() })
        .where(eq(futurePlanning.date, data.date))
        .returning();
      return updated;
    }
    const [newPlanning] = await db.insert(futurePlanning).values(data).returning();
    return newPlanning;
  }

  async deleteFuturePlanning(date: string): Promise<void> {
    await db.delete(futurePlanning).where(eq(futurePlanning.date, date));
  }

  async performMidnightReset(): Promise<void> {
    await db.update(todos).set({
      completed: false,
      completedBy: null,
      completedAt: null,
    });

    await db.delete(moduleStatus);

    await db.delete(qualityChecks);
    await db.delete(driverTasks);

    await db.delete(timedriverCalculations);
    
    await db.delete(futurePlanning);
    
    await db.delete(upgradeVehicles);
  }
}

export const storage = new DatabaseStorage();
