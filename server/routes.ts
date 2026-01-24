
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

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
        
        // Verify vehicle exists
        const vehicle = await storage.getVehicle(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const comment = await storage.createComment({ ...input, vehicleId });
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

  await seedDatabase();

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
