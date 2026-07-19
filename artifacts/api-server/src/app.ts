import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// --- Static frontend (production single-service deployment, e.g. Railway) ---
// The Vite build of @workspace/virtual-fitting lands in
// artifacts/virtual-fitting/dist/public. The bundled server file lives in
// artifacts/api-server/dist/index.mjs, so the frontend is two levels up.
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const staticDir =
  process.env.STATIC_DIR ??
  path.resolve(serverDir, "../../virtual-fitting/dist/public");

if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));

  // SPA fallback: any non-API GET request serves index.html
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });

  logger.info({ staticDir }, "Serving static frontend");
} else {
  logger.warn({ staticDir }, "Static frontend directory not found; API-only mode");
}

export default app;
