import { createApp } from "./app.js";
import { env } from "./config/env.js";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createApp();

// Serve frontend build if exists (dist folder at project root)
const distPath = path.resolve(process.cwd(), "dist");
app.use(express.static(distPath));
app.get(/^\/(?!api|health|uploads).*/, (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) res.status(404).json({ error: "Frontend not built. Run npm run build" });
  });
});

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`✅ PPE Backend running on http://localhost:${env.PORT}`);
  console.log(`   Health: http://localhost:${env.PORT}/health`);
  console.log(`   API: http://localhost:${env.PORT}/api`);
});
