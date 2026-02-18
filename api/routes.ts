import type { Express } from "express";
import { storage } from "./storage";
import { api } from "../shared/routes";
import { z } from "zod";

let initialized = false;

export async function registerApiRoutes(app: Express): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Health check endpoint - responds before any DB operations
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  await storage.seedBranchManager();

  app.get(api.vehicles.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const filter = req.query.filter as 'all' | 'expired' | undefined;
    const vehicles = await storage.getVehicles(filter, search);
    res.json(vehicles);
  });

  app.get(api.vehicles.get.path, async (req, res) => {
    const vehicle = await storage.getVehicleWithComments(Number(req.params.id));
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  });

  app.post(api.vehicles.create.path, async (req, res) => {
    try {
      const input = api.vehicles.create.input.parse(req.body);
      const vehicle = await storage.createVehicle(input);
      res.status(201).json(vehicle);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.vehicles.update.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getVehicle(id);
    if (!existing) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    try {
      const input = api.vehicles.update.input.parse(req.body);
      
      if (input.readyForCollection === true && !existing.readyForCollection) {
        const collectionTodo = await storage.createTodo({
          title: `Bodyshop Collection: ${existing.licensePlate}`,
          assignedTo: ["Counter"],
          vehicleId: id,
          isSystemGenerated: true,
          completed: false,
          isRecurring: false,
          priority: 0,
        });
        (input as any).collectionTodoId = collectionTodo.id;
      }
      
      if (input.readyForCollection === false && existing.readyForCollection && existing.collectionTodoId) {
        await storage.deleteTodo(existing.collectionTodoId);
        (input as any).collectionTodoId = null;
      }
      
      const updated = await storage.updateVehicle(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.vehicles.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getVehicle(id);
    if (!existing) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    await storage.deleteVehicle(id);
    res.status(204).send();
  });

  app.post(api.vehicles.createComment.path, async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      const input = api.vehicles.createComment.input.parse(req.body);
      
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      const comment = await storage.createComment({ ...input, vehicleId });
      
      const todayBerlin = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
      await storage.setVehicleDailyComment(vehicleId, todayBerlin, comment.id);
      
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.vehicles.listComments.path, async (req, res) => {
    const vehicleId = Number(req.params.id);
    const comments = await storage.getComments(vehicleId);
    res.json(comments);
  });

  async function requireAdmin(req: any, res: any): Promise<boolean> {
    const adminPin = req.headers['x-admin-pin'] as string;
    if (!adminPin) {
      res.status(403).json({ message: "Admin authorization required" });
      return false;
    }
    const adminUser = await storage.getUserByPin(adminPin);
    if (!adminUser || !adminUser.isAdmin) {
      res.status(403).json({ message: "Only Branch Manager can perform this action" });
      return false;
    }
    return true;
  }

  app.post(api.users.authenticate.path, async (req, res) => {
    try {
      const { pin } = api.users.authenticate.input.parse(req.body);
      const user = await storage.getUserByPin(pin);
      if (!user) {
        return res.status(401).json({ message: "Invalid PIN" });
      }
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.users.list.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get(api.users.drivers.path, async (req, res) => {
    const users = await storage.getUsers();
    const drivers = users
      .filter(u => u.roles?.includes("Driver") && u.maxDailyHours)
      .map(u => ({ id: u.id, initials: u.initials, maxDailyHours: u.maxDailyHours, hourlyRate: u.hourlyRate }));
    res.json(drivers);
  });

  app.get(api.users.get.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.post(api.users.create.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const input = api.users.create.input.parse(req.body);
      
      const isUnique = await storage.isPinUnique(input.pin);
      if (!isUnique) {
        return res.status(400).json({ message: "PIN already in use", field: "pin" });
      }

      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.users.update.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const id = Number(req.params.id);
    const existing = await storage.getUser(id);
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (existing.isAdmin && req.body.isAdmin === false) {
      return res.status(403).json({ message: "Cannot remove admin status from Branch Manager" });
    }

    try {
      const input = api.users.update.input.parse(req.body);

      if (input.pin) {
        const isUnique = await storage.isPinUnique(input.pin, id);
        if (!isUnique) {
          return res.status(400).json({ message: "PIN already in use", field: "pin" });
        }
      }

      const updated = await storage.updateUser(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.users.delete.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const id = Number(req.params.id);
    const existing = await storage.getUser(id);
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (existing.isAdmin) {
      return res.status(403).json({ message: "Cannot delete Branch Manager" });
    }

    await storage.deleteUser(id);
    res.status(204).send();
  });

  app.post(api.users.checkPin.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const { pin, excludeId } = api.users.checkPin.input.parse(req.body);
      const available = await storage.isPinUnique(pin, excludeId);
      res.json({ available });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.todos.list.path, async (req, res) => {
    const todos = await storage.getTodos();
    res.json(todos);
  });

  app.post(api.todos.create.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const input = api.todos.create.input.parse(req.body);
      const todo = await storage.createTodo(input);
      res.status(201).json(todo);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.todos.update.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getTodo(id);
    if (!existing) {
      return res.status(404).json({ message: "Todo not found" });
    }

    const isAdminRequest = req.body.title !== undefined;
    if (isAdminRequest && !(await requireAdmin(req, res))) return;

    try {
      const input = api.todos.update.input.parse(req.body);
      const updateData: any = { ...input };
      if (input.completed) {
        updateData.completedAt = new Date();
      }
      const updated = await storage.updateTodo(id, updateData);
      
      if (input.completed && existing.isSystemGenerated && existing.vehicleId) {
        await storage.updateVehicle(existing.vehicleId, { isPast: true });
      }
      
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.todos.delete.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const id = Number(req.params.id);
    const existing = await storage.getTodo(id);
    if (!existing) {
      return res.status(404).json({ message: "Todo not found" });
    }
    await storage.deleteTodo(id);
    res.status(204).send();
  });

  app.post(api.todos.postpone.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getTodo(id);
    if (!existing) {
      return res.status(404).json({ message: "Todo not found" });
    }
    
    if (!existing.isSystemGenerated) {
      return res.status(400).json({ message: "Only collection tasks can be postponed" });
    }
    
    if (existing.postponeCount >= 1) {
      return res.status(400).json({ message: "This task can only be postponed once" });
    }
    
    const tomorrowBerlin = new Date();
    tomorrowBerlin.setDate(tomorrowBerlin.getDate() + 1);
    const tomorrowDate = tomorrowBerlin.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
    
    const updated = await storage.updateTodo(id, {
      postponedToDate: tomorrowDate,
      postponeCount: existing.postponeCount + 1,
    });
    
    res.json(updated);
  });

  app.get(api.qualityChecks.list.path, async (req, res) => {
    const checks = await storage.getQualityChecks();
    res.json(checks);
  });

  app.post(api.qualityChecks.create.path, async (req, res) => {
    try {
      const input = api.qualityChecks.create.input.parse(req.body);
      const check = await storage.createQualityCheck(input);
      
      if (!input.passed) {
        await storage.createDriverTask({
          qualityCheckId: check.id,
          licensePlate: input.licensePlate,
          description: input.comment || `Quality check failed for ${input.licensePlate}`,
          completed: false,
        });
      }
      res.status(201).json(check);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get("/api/quality-checks/date/:date", async (req, res) => {
    const date = req.params.date;
    const checks = await storage.getQualityChecksForDate(date);
    const allDriverTasks = await storage.getDriverTasks();
    const checksWithStatus = checks.map(check => {
      const driverTask = allDriverTasks.find(t => t.qualityCheckId === check.id);
      return {
        ...check,
        driverTaskCompleted: driverTask?.completed ?? null,
        driverTaskCompletedBy: driverTask?.completedBy ?? null,
      };
    });
    res.json(checksWithStatus);
  });

  app.get(api.driverTasks.list.path, async (req, res) => {
    const tasks = await storage.getDriverTasks();
    res.json(tasks);
  });

  app.patch(api.driverTasks.update.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getDriverTask(id);
    if (!existing) {
      return res.status(404).json({ message: "Driver task not found" });
    }
    try {
      const input = api.driverTasks.update.input.parse(req.body);
      const updateData: any = { ...input };
      if (input.completed) {
        updateData.completedAt = new Date();
      }
      const updated = await storage.updateDriverTask(id, updateData);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.moduleStatus.list.path, async (req, res) => {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    const statuses = await storage.getModuleStatus(date);
    res.json(statuses);
  });

  app.post(api.moduleStatus.update.path, async (req, res) => {
    try {
      const input = api.moduleStatus.update.input.parse(req.body);
      const status = await storage.setModuleStatus(
        input.moduleName,
        input.date,
        input.isDone,
        input.doneBy
      );
      res.json(status);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.timedriverCalculations.get.path, async (req, res) => {
    const date = String(req.params.date);
    const calc = await storage.getTimedriverCalculation(date);
    res.json(calc || null);
  });

  app.post(api.timedriverCalculations.save.path, async (req, res) => {
    try {
      const input = api.timedriverCalculations.save.input.parse(req.body);
      const calc = await storage.saveTimedriverCalculation(input);
      
      const userPin = req.headers['x-admin-pin'] as string;
      const user = userPin ? await storage.getUserByPin(userPin) : null;
      await storage.setModuleStatus("timedriver", input.date, true, user?.initials);
      
      res.status(201).json(calc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.timedriverCalculations.delete.path, async (req, res) => {
    const date = String(req.params.date);
    await storage.deleteTimedriverCalculationForDate(date);
    await storage.setModuleStatus("timedriver", date, false);
    res.status(204).send();
  });

  app.get(api.dashboard.status.path, async (req, res) => {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    
    // Cleanup old completed flow tasks from previous days
    await storage.cleanupOldCompletedFlowTasks(date);
    
    const timedriverCalc = await storage.getTimedriverCalculation(date);
    const timedriverStatus = await storage.getModuleStatus(date);
    const timedriverModuleStatus = timedriverStatus.find(s => s.moduleName === "timedriver");
    const timedriverIsDone = timedriverModuleStatus?.isDone || timedriverCalc !== undefined;
    
    const pendingUpgrades = await storage.getPendingUpgradeVehicles(date);
    const todayUpgrades = await storage.getUpgradeVehiclesForDate(date);
    const now = new Date();
    const berlinTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
    const deadline = new Date(berlinTime);
    deadline.setHours(8, 30, 0, 0);
    const isOverdue = berlinTime > deadline && todayUpgrades.length === 0;
    const upgradeIsDone = todayUpgrades.length > 0;
    
    const allTodos = await storage.getTodos();
    const todaysTodos = allTodos.filter(t => !t.postponedToDate || t.postponedToDate <= date);
    const completed = todaysTodos.filter(t => t.completed).length;
    const postponedToFuture = allTodos.filter(t => t.postponedToDate && t.postponedToDate > date && !t.completed);
    const postponedFromPast = todaysTodos.filter(t => t.postponedToDate === date && !t.completed);
    const totalPostponed = postponedToFuture.length + postponedFromPast.length;
    const todoIsDone = todaysTodos.length > 0 && completed === todaysTodos.length && totalPostponed === 0;
    
    const qualityChecks = await storage.getQualityChecksForDate(date);
    const totalChecks = qualityChecks.length;
    const passedChecks = qualityChecks.filter(c => c.passed).length;
    const incompleteTasks = await storage.getIncompleteDriverTasks();
    const qualityIsDone = totalChecks >= 5;
    
    const vehiclesWithoutComment = await storage.getVehiclesWithoutDailyComment(date);
    const allVehicles = await storage.getVehicles();
    const activeVehicles = allVehicles.filter(v => !v.isPast);
    const bodyshopIsDone = activeVehicles.length === 0 || vehiclesWithoutComment.length === 0;
    
    const allFlowTasks = await storage.getFlowTasks();
    const pendingFlowTasks = allFlowTasks.filter(t => !t.completed);
    const flowIsDone = allFlowTasks.length === 0 || pendingFlowTasks.length === 0;
    
    const futurePlanningData = await storage.getFuturePlanning(date);
    const futureModuleStatus = timedriverStatus.find(s => s.moduleName === "future");
    const futureIsDone = futureModuleStatus?.isDone || futurePlanningData !== undefined;
    const berlinHour = berlinTime.getHours();
    const futureIsLocked = berlinHour < 15;
    
    let totalProgress = 0;
    const moduleWeight = 1 / 7;

    if (timedriverIsDone) totalProgress += moduleWeight;
    if (upgradeIsDone) totalProgress += moduleWeight;

    if (allFlowTasks.length === 0) {
      if (flowIsDone) totalProgress += moduleWeight;
    } else {
      const flowCompleted = allFlowTasks.filter(t => t.completed).length;
      totalProgress += moduleWeight * (flowCompleted / allFlowTasks.length);
    }

    if (todaysTodos.length === 0) {
      totalProgress += moduleWeight;
    } else {
      totalProgress += moduleWeight * (completed / todaysTodos.length);
    }

    if (qualityIsDone) {
      totalProgress += moduleWeight;
    } else {
      totalProgress += moduleWeight * Math.min(totalChecks / 5, 1);
    }

    if (activeVehicles.length === 0) {
      totalProgress += moduleWeight;
    } else {
      const vehiclesWithComment = activeVehicles.length - vehiclesWithoutComment.length;
      totalProgress += moduleWeight * (vehiclesWithComment / activeVehicles.length);
    }

    if (futureIsDone) totalProgress += moduleWeight;

    const overallProgress = Math.round(totalProgress * 100);
    
    res.json({
      timedriver: { isDone: timedriverIsDone, details: timedriverCalc ? "Calculated" : undefined },
      upgrade: { isDone: upgradeIsDone, hasPending: pendingUpgrades.length > 0, isOverdue, pendingVehicles: pendingUpgrades },
      flow: { isDone: flowIsDone, pending: pendingFlowTasks.length, total: allFlowTasks.length },
      todo: { isDone: todoIsDone, completed, total: todaysTodos.length, postponed: totalPostponed },
      quality: { isDone: qualityIsDone, totalChecks, passedChecks, incompleteTasks: incompleteTasks.length },
      bodyshop: { isDone: bodyshopIsDone, vehiclesWithoutComment: vehiclesWithoutComment.length, total: activeVehicles.length },
      future: { isDone: futureIsDone, isLocked: futureIsLocked, data: futurePlanningData },
      overallProgress,
      hasPostponedTasks: totalPostponed > 0,
    });
  });

  async function requireAdminOrCounter(req: any, res: any): Promise<boolean> {
    const adminPin = req.headers['x-admin-pin'] as string;
    if (!adminPin) {
      res.status(403).json({ message: "Authorization required" });
      return false;
    }
    const user = await storage.getUserByPin(adminPin);
    if (!user || (!user.isAdmin && !user.roles.includes("Counter"))) {
      res.status(403).json({ message: "Only Admin or Counter can perform this action" });
      return false;
    }
    return true;
  }

  app.get(api.flowTasks.list.path, async (req, res) => {
    const tasks = await storage.getFlowTasks();
    res.json(tasks);
  });

  app.post(api.flowTasks.create.path, async (req, res) => {
    if (!(await requireAdminOrCounter(req, res))) return;
    try {
      const input = api.flowTasks.create.input.parse(req.body);
      const task = await storage.createFlowTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.flowTasks.update.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getFlowTask(id);
    if (!existing) {
      return res.status(404).json({ message: "Flow task not found" });
    }

    const isAdminAction = req.body.licensePlate !== undefined || 
                          req.body.needsRetry !== undefined ||
                          req.body.taskType !== undefined ||
                          req.body.isEv !== undefined;
    if (isAdminAction && !(await requireAdminOrCounter(req, res))) return;

    if (req.body.completed === true) {
      const userPin = req.headers['x-admin-pin'] as string;
      if (!userPin) {
        return res.status(401).json({ message: "Authentication required to complete tasks" });
      }
      const user = await storage.getUserByPin(userPin);
      if (!user || (!user.isAdmin && !user.roles.includes("Counter") && !user.roles.includes("Driver"))) {
        return res.status(403).json({ message: "Only Driver, Counter, or Admin can complete tasks" });
      }
    }

    try {
      const input = api.flowTasks.update.input.parse(req.body);
      const updateData: any = { ...input };
      if (input.completed) {
        updateData.completedAt = new Date();
        updateData.needsRetry = false;
      }
      if (input.needsRetry) {
        updateData.completed = false;
        updateData.completedAt = null;
        updateData.completedBy = null;
      }
      const updated = await storage.updateFlowTask(id, updateData);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.flowTasks.delete.path, async (req, res) => {
    if (!(await requireAdminOrCounter(req, res))) return;
    const id = Number(req.params.id);
    const existing = await storage.getFlowTask(id);
    if (!existing) {
      return res.status(404).json({ message: "Flow task not found" });
    }
    await storage.deleteFlowTask(id);
    res.status(204).send();
  });

  app.post(api.flowTasks.reorder.path, async (req, res) => {
    if (!(await requireAdminOrCounter(req, res))) return;
    try {
      const input = api.flowTasks.reorder.input.parse(req.body);
      await storage.reorderFlowTasks(input.taskIds);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.settings.get.path, async (req, res) => {
    const key = String(req.params.key);
    const value = await storage.getSetting(key);
    res.json({ value });
  });

  app.put(api.settings.set.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const key = String(req.params.key);
      const input = api.settings.set.input.parse(req.body);
      const setting = await storage.setSetting(key, input.value);
      res.json(setting);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.upgradeVehicles.list.path, async (req, res) => {
    const vehicles = await storage.getUpgradeVehicles();
    res.json(vehicles);
  });

  app.get(api.upgradeVehicles.listForDate.path, async (req, res) => {
    const date = req.params.date as string;
    const vehicles = await storage.getUpgradeVehiclesForDate(date);
    res.json(vehicles);
  });

  app.get(api.upgradeVehicles.pending.path, async (req, res) => {
    const date = req.params.date as string;
    const vehicle = await storage.getPendingUpgradeVehicle(date);
    res.json(vehicle || null);
  });

  app.get(api.upgradeVehicles.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const vehicle = await storage.getUpgradeVehicle(id);
    if (!vehicle) {
      return res.status(404).json({ message: "Upgrade vehicle not found" });
    }
    res.json(vehicle);
  });

  app.post(api.upgradeVehicles.create.path, async (req, res) => {
    try {
      const input = api.upgradeVehicles.create.input.parse(req.body);
      const vehicle = await storage.createUpgradeVehicle(input);
      res.status(201).json(vehicle);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.upgradeVehicles.update.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getUpgradeVehicle(id);
    if (!existing) {
      return res.status(404).json({ message: "Upgrade vehicle not found" });
    }
    try {
      const input = api.upgradeVehicles.update.input.parse(req.body);
      const updateData: any = { ...input };
      if (input.isSold) {
        updateData.soldAt = new Date();
      }
      const updated = await storage.updateUpgradeVehicle(id, updateData);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.upgradeVehicles.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getUpgradeVehicle(id);
    if (!existing) {
      return res.status(404).json({ message: "Upgrade vehicle not found" });
    }
    await storage.deleteUpgradeVehicle(id);
    res.status(204).send();
  });

  app.get(api.futurePlanning.get.path, async (req, res) => {
    const date = String(req.params.date);
    const planning = await storage.getFuturePlanning(date);
    res.json(planning || null);
  });

  app.post(api.futurePlanning.save.path, async (req, res) => {
    try {
      const input = api.futurePlanning.save.input.parse(req.body);
      
      const sum = input.reservationsCar + input.reservationsVan + input.reservationsTas;
      if (sum !== input.reservationsTotal) {
        return res.status(400).json({ 
          message: "Car + Van + TAS must equal Total reservations",
          field: "reservationsTotal"
        });
      }
      
      const planning = await storage.saveFuturePlanning(input);
      
      const userPin = req.headers['x-admin-pin'] as string;
      const user = userPin ? await storage.getUserByPin(userPin) : null;
      await storage.setModuleStatus("future", input.date, true, user?.initials);
      
      res.status(201).json(planning);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.futurePlanning.delete.path, async (req, res) => {
    const date = String(req.params.date);
    await storage.deleteFuturePlanning(date);
    await storage.setModuleStatus("future", date, false);
    res.status(204).send();
  });

  app.get(api.kpiMetrics.list.path, async (_req, res) => {
    const metrics = await storage.getKpiMetrics();
    res.json(metrics);
  });

  app.get(api.kpiMetrics.get.path, async (req, res) => {
    const key = String(req.params.key);
    const metric = await storage.getKpiMetric(key);
    res.json(metric || null);
  });

  app.put(api.kpiMetrics.update.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const key = String(req.params.key);
      if (key !== "irpd" && key !== "ses") {
        return res.status(400).json({ message: "Invalid KPI key. Must be 'irpd' or 'ses'" });
      }
      const input = api.kpiMetrics.update.input.parse(req.body);
      const adminPin = req.headers['x-admin-pin'] as string;
      const adminUser = await storage.getUserByPin(adminPin);
      
      const metric = await storage.upsertKpiMetric({
        key: key as "irpd" | "ses",
        value: input.value,
        goal: input.goal,
        updatedBy: adminUser?.initials,
      });
      res.json(metric);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });
}
