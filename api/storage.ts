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
  kpiMetrics,
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
  type InsertKpiMetric,
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
  type KpiMetric,
} from "../shared/schema";
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
  deleteQualityCheck(id: number): Promise<void>;
  getQualityChecksForDate(date: string): Promise<QualityCheck[]>;

  getDriverTasks(): Promise<DriverTask[]>;
  getDriverTask(id: number): Promise<DriverTask | undefined>;
  getDriverTasksForDate(date: string): Promise<DriverTask[]>;
  cleanupOldCompletedFlowTasks(todayDate: string): Promise<void>;
  createDriverTask(task: InsertDriverTask): Promise<DriverTask>;
  updateDriverTask(id: number, data: Partial<DriverTask>): Promise<DriverTask | undefined>;
  getIncompleteDriverTasks(): Promise<DriverTask[]>;

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

  getUpgradeVehicles(): Promise<UpgradeVehicle[]>;
  getUpgradeVehicle(id: number): Promise<UpgradeVehicle | undefined>;
  getUpgradeVehiclesForDate(date: string): Promise<UpgradeVehicle[]>;
  getPendingUpgradeVehicle(date: string): Promise<UpgradeVehicle | undefined>;
  getPendingUpgradeVehicles(date: string): Promise<UpgradeVehicle[]>;
  createUpgradeVehicle(vehicle: InsertUpgradeVehicle): Promise<UpgradeVehicle>;
  updateUpgradeVehicle(id: number, data: Partial<UpgradeVehicle>): Promise<UpgradeVehicle | undefined>;
  deleteUpgradeVehicle(id: number): Promise<void>;

  getFuturePlanning(date: string): Promise<FuturePlanning | undefined>;
  saveFuturePlanning(planning: InsertFuturePlanning): Promise<FuturePlanning>;
  deleteFuturePlanning(date: string): Promise<void>;

  getKpiMetrics(): Promise<KpiMetric[]>;
  getKpiMetric(key: string): Promise<KpiMetric | undefined>;
  upsertKpiMetric(metric: InsertKpiMetric): Promise<KpiMetric>;
}

class DatabaseStorage implements IStorage {
  async getVehicles(filter?: 'all' | 'expired', search?: string): Promise<Vehicle[]> {
    let query = db.select().from(vehicles);
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      const allVehicles = await query.orderBy(desc(vehicles.countdownStart));
      return allVehicles.filter(v => 
        v.licensePlate.toLowerCase().includes(lowerSearch) ||
        (v.name && v.name.toLowerCase().includes(lowerSearch))
      );
    }
    
    const allVehicles = await query.orderBy(desc(vehicles.countdownStart));
    
    if (filter === 'expired') {
      const now = new Date();
      return allVehicles.filter(v => {
        if (v.isPast) return false;
        const end = new Date(v.countdownStart);
        end.setDate(end.getDate() + 7);
        return now > end;
      });
    }
    
    return allVehicles;
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
    await db.delete(comments).where(eq(comments.vehicleId, id));
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getComments(vehicleId: number): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.vehicleId, vehicleId)).orderBy(desc(comments.createdAt));
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(asc(users.initials));
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
    const existing = await query;
    if (existing.length === 0) return true;
    if (excludeId && existing.length === 1 && existing[0].id === excludeId) return true;
    return false;
  }

  async seedBranchManager(): Promise<void> {
    const existing = await this.getUserByPin("4266");
    if (!existing) {
      await this.createUser({
        initials: "BM",
        pin: "4266",
        roles: ["Counter"],
        isAdmin: true,
        maxDailyHours: null,
        hourlyRate: null,
      });
    }
  }

  async getTodos(): Promise<Todo[]> {
    return db.select().from(todos).orderBy(desc(todos.priority), asc(todos.id));
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
    return db.select().from(qualityChecks).orderBy(desc(qualityChecks.createdAt));
  }

  async getQualityCheck(id: number): Promise<QualityCheck | undefined> {
    const [check] = await db.select().from(qualityChecks).where(eq(qualityChecks.id, id));
    return check;
  }

  async createQualityCheck(check: InsertQualityCheck): Promise<QualityCheck> {
    const [newCheck] = await db.insert(qualityChecks).values(check).returning();
    return newCheck;
  }

  async deleteQualityCheck(id: number): Promise<void> {
    await db.delete(driverTasks).where(eq(driverTasks.qualityCheckId, id));
    await db.delete(qualityChecks).where(eq(qualityChecks.id, id));
  }

  async getQualityChecksForDate(date: string): Promise<QualityCheck[]> {
    return db.select().from(qualityChecks)
      .where(sql`DATE(${qualityChecks.createdAt} AT TIME ZONE 'Europe/Berlin') = ${date}`)
      .orderBy(desc(qualityChecks.createdAt));
  }

  async getDriverTasks(): Promise<DriverTask[]> {
    return db.select().from(driverTasks).orderBy(desc(driverTasks.createdAt));
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

  async getIncompleteDriverTasks(): Promise<DriverTask[]> {
    return db.select().from(driverTasks).where(eq(driverTasks.completed, false));
  }

  async getDriverTasksForDate(date: string): Promise<DriverTask[]> {
    return await db.select().from(driverTasks)
      .where(sql`DATE(${driverTasks.createdAt} AT TIME ZONE 'Europe/Berlin') = ${date}`)
      .orderBy(desc(driverTasks.createdAt));
  }

  async cleanupOldCompletedFlowTasks(todayDate: string): Promise<void> {
    const result = await db.delete(flowTasks).where(
      and(
        eq(flowTasks.completed, true),
        sql`DATE(${flowTasks.createdAt} AT TIME ZONE 'Europe/Berlin') < ${todayDate}`
      )
    ).returning();
    if (result.length > 0) {
      console.log(`[storage] Cleaned up ${result.length} old completed flow tasks`);
    }
  }

  async getModuleStatus(date: string): Promise<ModuleStatus[]> {
    return db.select().from(moduleStatus).where(eq(moduleStatus.date, date));
  }

  async setModuleStatus(moduleName: string, date: string, isDone: boolean, doneBy?: string): Promise<ModuleStatus> {
    const existing = await db.select().from(moduleStatus)
      .where(and(eq(moduleStatus.moduleName, moduleName), eq(moduleStatus.date, date)));
    
    if (existing.length > 0) {
      const [updated] = await db.update(moduleStatus)
        .set({ isDone, doneBy, doneAt: isDone ? new Date() : null })
        .where(and(eq(moduleStatus.moduleName, moduleName), eq(moduleStatus.date, date)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(moduleStatus)
        .values({ moduleName, date, isDone, doneBy, doneAt: isDone ? new Date() : null })
        .returning();
      return created;
    }
  }

  async getFlowTasks(): Promise<FlowTask[]> {
    return db.select().from(flowTasks).orderBy(asc(flowTasks.priority), asc(flowTasks.id));
  }

  async getFlowTask(id: number): Promise<FlowTask | undefined> {
    const [task] = await db.select().from(flowTasks).where(eq(flowTasks.id, id));
    return task;
  }

  async createFlowTask(task: InsertFlowTask): Promise<FlowTask> {
    const maxPriority = await db.select({ max: sql<number>`COALESCE(MAX(priority), 0)` }).from(flowTasks);
    const newPriority = (maxPriority[0]?.max || 0) + 1;
    const [newTask] = await db.insert(flowTasks).values({ ...task, priority: newPriority }).returning();
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
    } else {
      const [created] = await db.insert(appSettings).values({ key, value }).returning();
      return created;
    }
  }

  async getTimedriverCalculation(date: string): Promise<TimedriverCalculation | undefined> {
    const [calc] = await db.select().from(timedriverCalculations).where(eq(timedriverCalculations.date, date));
    return calc;
  }

  async saveTimedriverCalculation(calc: InsertTimedriverCalculation): Promise<TimedriverCalculation> {
    const existing = await this.getTimedriverCalculation(calc.date);
    if (existing) {
      const [updated] = await db.update(timedriverCalculations)
        .set({ ...calc, calculatedAt: new Date() })
        .where(eq(timedriverCalculations.date, calc.date))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(timedriverCalculations)
        .values({ ...calc, calculatedAt: new Date() })
        .returning();
      return created;
    }
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
        .where(and(eq(vehicleComments.vehicleId, vehicleId), eq(vehicleComments.date, date)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(vehicleComments)
        .values({ vehicleId, date, hasComment: true, commentId })
        .returning();
      return created;
    }
  }

  async getVehiclesWithoutDailyComment(date: string): Promise<Vehicle[]> {
    const allVehicles = await this.getVehicles();
    const activeVehicles = allVehicles.filter(v => !v.isPast);
    
    const vehiclesWithComments = await db.select().from(vehicleComments)
      .where(and(eq(vehicleComments.date, date), eq(vehicleComments.hasComment, true)));
    
    const vehicleIdsWithComments = new Set(vehiclesWithComments.map(vc => vc.vehicleId));
    return activeVehicles.filter(v => !vehicleIdsWithComments.has(v.id));
  }

  async getUpgradeVehicles(): Promise<UpgradeVehicle[]> {
    return db.select().from(upgradeVehicles).orderBy(desc(upgradeVehicles.createdAt));
  }

  async getUpgradeVehicle(id: number): Promise<UpgradeVehicle | undefined> {
    const [vehicle] = await db.select().from(upgradeVehicles).where(eq(upgradeVehicles.id, id));
    return vehicle;
  }

  async getUpgradeVehiclesForDate(date: string): Promise<UpgradeVehicle[]> {
    return db.select().from(upgradeVehicles)
      .where(eq(upgradeVehicles.date, date))
      .orderBy(desc(upgradeVehicles.createdAt));
  }

  async getPendingUpgradeVehicle(date: string): Promise<UpgradeVehicle | undefined> {
    const [vehicle] = await db.select().from(upgradeVehicles)
      .where(and(eq(upgradeVehicles.date, date), eq(upgradeVehicles.isSold, false)));
    return vehicle;
  }

  async getPendingUpgradeVehicles(date: string): Promise<UpgradeVehicle[]> {
    return db.select().from(upgradeVehicles)
      .where(and(eq(upgradeVehicles.date, date), eq(upgradeVehicles.isSold, false)));
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

  async getFuturePlanning(date: string): Promise<FuturePlanning | undefined> {
    const [planning] = await db.select().from(futurePlanning).where(eq(futurePlanning.date, date));
    return planning;
  }

  async saveFuturePlanning(planning: InsertFuturePlanning): Promise<FuturePlanning> {
    const existing = await this.getFuturePlanning(planning.date);
    if (existing) {
      const [updated] = await db.update(futurePlanning)
        .set({ ...planning, savedAt: new Date() })
        .where(eq(futurePlanning.date, planning.date))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(futurePlanning)
        .values({ ...planning, savedAt: new Date() })
        .returning();
      return created;
    }
  }

  async deleteFuturePlanning(date: string): Promise<void> {
    await db.delete(futurePlanning).where(eq(futurePlanning.date, date));
  }

  async getKpiMetrics(): Promise<KpiMetric[]> {
    return db.select().from(kpiMetrics);
  }

  async getKpiMetric(key: string): Promise<KpiMetric | undefined> {
    const [metric] = await db.select().from(kpiMetrics).where(eq(kpiMetrics.key, key));
    return metric;
  }

  async upsertKpiMetric(metric: InsertKpiMetric): Promise<KpiMetric> {
    const existing = await this.getKpiMetric(metric.key);
    if (existing) {
      const [updated] = await db.update(kpiMetrics)
        .set({ ...metric, updatedAt: new Date() })
        .where(eq(kpiMetrics.key, metric.key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(kpiMetrics)
        .values({ ...metric, updatedAt: new Date() })
        .returning();
      return created;
    }
  }
}

export const storage: IStorage = new DatabaseStorage();
