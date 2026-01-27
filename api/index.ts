import express, { Request, Response, NextFunction } from "express";
import { registerApiRoutes } from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Promise that resolves when routes are registered
let routesPromise: Promise<void> | null = null;

function getRoutesPromise(): Promise<void> {
  if (!routesPromise) {
    routesPromise = registerApiRoutes(app);
  }
  return routesPromise;
}

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("API Error:", err);
  res.status(status).json({ message });
});

// Vercel serverless handler - must wait for routes before handling
export default async function handler(req: Request, res: Response) {
  await getRoutesPromise();
  return app(req, res);
}
