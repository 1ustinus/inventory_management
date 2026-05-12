import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // In-memory buffer for remote scans
  const stationScans = new Map<string, { barcode: string, timestamp: number }>();

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", system: "FlexiMart POS" });
  });

  // Remote Scanning Endpoints
  app.post("/api/station/:id/scan", (req, res) => {
    const { id } = req.params;
    const { barcode } = req.body;
    console.log(`[SCAN] Station ${id}: ${barcode}`);
    stationScans.set(id, { barcode, timestamp: Date.now() });
    res.json({ success: true });
  });

  app.get("/api/station/:id/poll", (req, res) => {
    const { id } = req.params;
    const scan = stationScans.get(id);
    
    // Log occasionally to avoid spam but show activity
    if (Math.random() > 0.95) console.log(`[POLL] Station ${id} active`);

    // Return scan if it's less than 10 seconds old
    if (scan && Date.now() - scan.timestamp < 10000) {
      stationScans.delete(id);
      return res.json({ barcode: scan.barcode });
    }
    res.json({ barcode: null });
  });
  
  app.post("/api/sync/sales", (req, res) => {
    const { sales } = req.body;
    console.log(`[SYNC] Received ${sales?.length || 0} sales for backup.`);
    res.json({ success: true, syncedCount: sales?.length || 0 });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[SERVER ERR]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server failure:", err);
});
