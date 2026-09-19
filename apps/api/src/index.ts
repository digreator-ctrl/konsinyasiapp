// ============================================================
// KonsinyasiApp — Hono API Entry Point
// Main router with middleware and route mounting
// ============================================================

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { HTTPException } from "hono/http-exception";

import { authRoutes } from "./routes/auth";
import { tenantRoutes } from "./routes/tenants";
import { userRoutes } from "./routes/users";
import { roleRoutes } from "./routes/roles";
import { producerRoutes } from "./routes/producers";
import { productRoutes } from "./routes/products";
import { stockEntryRoutes } from "./routes/stock-entries";
import { warehouseRoutes } from "./routes/warehouse";
import { distributionRoutes } from "./routes/distributions";
import { consignmentRoutes } from "./routes/consignments";
import { returnRoutes } from "./routes/returns";
import { storeRoutes } from "./routes/stores";
import { reportRoutes } from "./routes/reports";
import { mediaRoutes } from "./routes/media";

// ---- Type Definitions ----
export type Bindings = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  FRONTEND_URL: string;
};

export type Variables = {
  userId: string;
  tenantId: string;
  userRoles: string[];
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

// ---- Create App ----
const app = new Hono<AppEnv>();

// ---- Global Middleware ----
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);

// ---- Health Check ----
app.get("/", (c) => {
  return c.json({
    name: "KonsinyasiApp API",
    version: "0.1.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// ---- Mount Routes ----
app.route("/api/auth", authRoutes);
app.route("/api/tenants", tenantRoutes);
app.route("/api/users", userRoutes);
app.route("/api/roles", roleRoutes);
app.route("/api/producers", producerRoutes);
app.route("/api/products", productRoutes);
app.route("/api/stock-entries", stockEntryRoutes);
app.route("/api/warehouse", warehouseRoutes);
app.route("/api/distributions", distributionRoutes);
app.route("/api/consignments", consignmentRoutes);
app.route("/api/returns", returnRoutes);
app.route("/api/stores", storeRoutes);
app.route("/api/reports", reportRoutes);
app.route("/api/media", mediaRoutes);

// ---- Global Error Handler ----
app.onError((err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: err.message,
      },
      err.status
    );
  }

  return c.json(
    {
      success: false,
      error: "Terjadi kesalahan internal server",
    },
    500
  );
});

// ---- 404 Handler ----
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Endpoint tidak ditemukan",
    },
    404
  );
});

export default app;
