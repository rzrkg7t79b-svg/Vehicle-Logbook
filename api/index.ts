import express, { type Request, Response, NextFunction } from "express";
import { registerApiRoutes } from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let routesRegistered = false;

async function ensureRoutes() {
  if (!routesRegistered) {
    await registerApiRoutes(app);
    routesRegistered = true;
  }
}

app.use(async (req: Request, res: Response, next: NextFunction) => {
  await ensureRoutes();
  next();
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("API Error:", err);
  return res.status(status).json({ message });
});

import express, { type Request, Response, NextFunction } from "express";
import { registerApiRoutes } from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let routesRegistered = false;

async function ensureRoutes() {
  if (!routesRegistered) {
    await registerApiRoutes(app);
    routesRegistered = true;
  }
}

app.use(async (req: Request, res: Response, next: NextFunction) => {
  await ensureRoutes();
  next();
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("API Error:", err);
  return res.status(status).json({ message });
});

import express, { type Request, Response, NextFunction } from "express";
import { registerApiRoutes } from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let routesRegistered = false;

async function ensureRoutes() {
  if (!routesRegistered) {
    await registerApiRoutes(app);
    routesRegistered = true;
  }
}

app.use(async (req: Request, res: Response, next: NextFunction) => {
  await ensureRoutes();
  next();
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("API Error:", err);
  return res.status(status).json({ message });
});

export default function handler(req: any, res: any) {
  app(req, res);
}
