import express from "express";
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

app.use(async (req, res, next) => {
  await ensureRoutes();
  next();
});

app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("API Error:", err);
  res.status(status).json({ message });
});

export default function handler(req: any, res: any) {
  app(req, res);
}
