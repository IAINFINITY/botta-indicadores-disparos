import cors from "cors";
import express from "express";
import { conversationThreadHandler, dashboardHandler } from "./routes/dashboard.js";
import { healthHandler } from "./routes/health.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      name: "botta-indicadores-backend",
      status: "ok",
      message: "Backend foundation ready.",
    });
  });

  app.get("/health", healthHandler);
  app.get("/api/dashboard", dashboardHandler);
  app.get("/api/conversations/:id/messages", conversationThreadHandler);

  app.use((_req, res) => {
    res.status(404).json({
      error: "not_found",
      message: "Route not found.",
    });
  });

  return app;
}
