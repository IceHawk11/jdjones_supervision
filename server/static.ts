import express, { type Express } from "express";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  // ✅ serve static assets
  app.use(express.static(distPath));

  // ✅ Express v5 safe SPA fallback (NOT "*")
  app.get("/*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
