import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.js";
import jobPositionRouter from "./routes/jobPositions.js";
import locationRouter from "./routes/locations.js";
import attributeRouter from "./routes/attributes.js";
import itemGroupRouter from "./routes/itemGroups.js";
import ppeItemRouter from "./routes/ppeItems.js";
import kitRouter from "./routes/kits.js";
import employeeRouter from "./routes/employees.js";
import stockRouter from "./routes/stock.js";
import openingBalanceRouter from "./routes/openingBalances.js";
import issuanceRouter from "./routes/issuances.js";
import scrapRouter from "./routes/scrap.js";
import auditRouter from "./routes/audit.js";
import expiryRouter from "./routes/expiry.js";
import trashRouter from "./routes/trash.js";
import dashboardRouter from "./routes/dashboard.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export function createApp() {
    const app = express();
    app.use(helmet({ crossOriginResourcePolicy: false }));
    app.use(cors({
        origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
        credentials: true,
    }));
    app.use(morgan("dev"));
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true }));
    // serve uploads
    app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
    // health
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString(), env: env.NODE_ENV });
    });
    app.get("/api", (_req, res) => {
        res.json({
            message: "PPE Backend API v1",
            endpoints: [
                "/api/auth",
                "/api/job-positions",
                "/api/locations",
                "/api/attributes",
                "/api/item-groups",
                "/api/ppe-items",
                "/api/kits",
                "/api/employees",
                "/api/stock/*",
                "/api/opening-balances",
                "/api/issuances",
                "/api/scrap",
                "/api/audit-logs",
                "/api/expiry-settings",
                "/api/trash",
                "/api/dashboard/stats",
            ],
        });
    });
    app.use("/api/auth", authRouter);
    app.use("/api/job-positions", jobPositionRouter);
    app.use("/api/locations", locationRouter);
    app.use("/api/attributes", attributeRouter);
    app.use("/api/item-groups", itemGroupRouter);
    app.use("/api/ppe-items", ppeItemRouter);
    app.use("/api/kits", kitRouter);
    app.use("/api/employees", employeeRouter);
    app.use("/api/stock", stockRouter);
    app.use("/api/opening-balances", openingBalanceRouter);
    app.use("/api/issuances", issuanceRouter);
    app.use("/api/scrap", scrapRouter);
    app.use("/api/audit-logs", auditRouter);
    app.use("/api/expiry-settings", expiryRouter);
    app.use("/api/trash", trashRouter);
    app.use("/api/dashboard", dashboardRouter);
    // 404
    app.use((_req, res) => {
        res.status(404).json({ error: "Route not found" });
    });
    app.use(errorHandler);
    return app;
}
