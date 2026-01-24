
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { broadcastUpdate } from "./websocket";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
      broadcastUpdate("vehicles");
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
      const updated = await storage.updateVehicle(id, input);
      broadcastUpdate("vehicles");
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
    broadcastUpdate("vehicles");
    res.status(204).send();
  });

  app.post(api.vehicles.createComment.path, async (req, res) => {
    try {
        const vehicleId = Number(req.params.id);
        const input = api.vehicles.createComment.input.parse(req.body);
        
        // Verify vehicle exists
        const vehicle = await storage.getVehicle(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const comment = await storage.createComment({ ...input, vehicleId });
        broadcastUpdate("vehicles");
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

  // Helper function to verify admin authorization
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

  // User routes
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
      
      // Check PIN uniqueness
      const isUnique = await storage.isPinUnique(input.pin);
      if (!isUnique) {
        return res.status(400).json({ message: "PIN already in use", field: "pin" });
      }

      const user = await storage.createUser(input);
      broadcastUpdate("users");
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
    
    // Prevent modifying Branch Manager's admin status
    if (existing.isAdmin && req.body.isAdmin === false) {
      return res.status(403).json({ message: "Cannot remove admin status from Branch Manager" });
    }

    try {
      const input = api.users.update.input.parse(req.body);

      // Check PIN uniqueness if being updated
      if (input.pin) {
        const isUnique = await storage.isPinUnique(input.pin, id);
        if (!isUnique) {
          return res.status(400).json({ message: "PIN already in use", field: "pin" });
        }
      }

      const updated = await storage.updateUser(id, input);
      broadcastUpdate("users");
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
    
    // Prevent deleting the Branch Manager
    if (existing.isAdmin) {
      return res.status(403).json({ message: "Cannot delete Branch Manager" });
    }

    await storage.deleteUser(id);
    broadcastUpdate("users");
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

  // Todo routes
  app.get(api.todos.list.path, async (req, res) => {
    const todos = await storage.getTodos();
    res.json(todos);
  });

  app.post(api.todos.create.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const input = api.todos.create.input.parse(req.body);
      const todo = await storage.createTodo(input);
      broadcastUpdate("todos");
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
      broadcastUpdate("todos");
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
    broadcastUpdate("todos");
    res.status(204).send();
  });

  // Quality check routes
  app.get(api.qualityChecks.list.path, async (req, res) => {
    const checks = await storage.getQualityChecks();
    res.json(checks);
  });

  app.post(api.qualityChecks.create.path, async (req, res) => {
    try {
      const input = api.qualityChecks.create.input.parse(req.body);
      const check = await storage.createQualityCheck(input);
      
      // If not passed, create a driver task
      if (!input.passed) {
        await storage.createDriverTask({
          qualityCheckId: check.id,
          licensePlate: input.licensePlate,
          description: input.comment || `Quality check failed for ${input.licensePlate}`,
          completed: false,
        });
        broadcastUpdate("driver-tasks");
      }
      broadcastUpdate("quality-checks");
      res.status(201).json(check);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Driver task routes
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
      broadcastUpdate("driver-tasks");
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Module status routes
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
      broadcastUpdate("module-status");
      res.json(status);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Helper to check if user is admin or counter
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

  // Flow task routes
  app.get(api.flowTasks.list.path, async (req, res) => {
    const tasks = await storage.getFlowTasks();
    res.json(tasks);
  });

  app.post(api.flowTasks.create.path, async (req, res) => {
    if (!(await requireAdminOrCounter(req, res))) return;
    try {
      const input = api.flowTasks.create.input.parse(req.body);
      const task = await storage.createFlowTask(input);
      broadcastUpdate("flow-tasks");
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

    // Check if changing license plate or marking as undone (needs admin/counter)
    const isAdminAction = req.body.licensePlate !== undefined || 
                          req.body.needsRetry !== undefined ||
                          req.body.taskType !== undefined ||
                          req.body.isEv !== undefined;
    if (isAdminAction && !(await requireAdminOrCounter(req, res))) return;

    // Completion requires Driver, Counter, or Admin role (header required)
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
      broadcastUpdate("flow-tasks");
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
    broadcastUpdate("flow-tasks");
    res.status(204).send();
  });

  app.post(api.flowTasks.reorder.path, async (req, res) => {
    if (!(await requireAdminOrCounter(req, res))) return;
    try {
      const input = api.flowTasks.reorder.input.parse(req.body);
      await storage.reorderFlowTasks(input.taskIds);
      broadcastUpdate("flow-tasks");
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  await seedDatabase();
  await storage.seedBranchManager();

  return httpServer;
}

async function seedDatabase() {
    // Only seed if empty
    const existing = await storage.getVehicles();
    if (existing.length === 0) {
        const today = new Date();
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        
        const eightDaysAgo = new Date(today);
        eightDaysAgo.setDate(today.getDate() - 8);

        // Vehicle 1: Normal (just created)
        const v1 = await storage.createVehicle({
            licensePlate: "M-AB 1234",
            name: "Golf GTI",
            notes: "Routine checkup",
            isEv: false,
            countdownStart: today
        });
        await storage.createComment({ vehicleId: v1.id, content: "Vehicle received." });

        // Vehicle 2: Warning (2 days old -> 5 days left, wait, 7 day timer... )
        // If created 2 days ago, 5 days left.
        // Warning is 1-3 days left. So created 5 days ago = 2 days left.
        const fiveDaysAgo = new Date(today);
        fiveDaysAgo.setDate(today.getDate() - 5);
        
        const v2 = await storage.createVehicle({
            licensePlate: "B-XY 9999",
            name: "Customer Waiting",
            notes: "Urgent repair",
            isEv: false,
            countdownStart: fiveDaysAgo
        });
        await storage.createComment({ vehicleId: v2.id, content: "Parts ordered." });
        await storage.createComment({ vehicleId: v2.id, content: "Customer called for update." });

        // Vehicle 3: Expired (8 days ago)
        const v3 = await storage.createVehicle({
            licensePlate: "H-EV 2024E",
            name: "Tesla Model 3",
            notes: "Battery check",
            isEv: true,
            countdownStart: eightDaysAgo
        });
        await storage.createComment({ vehicleId: v3.id, content: "Overdue for pickup." });
    }
}
