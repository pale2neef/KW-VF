import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * Simple in-memory daily rate limiter, keyed by client IP.
 *
 * Notes:
 * - Counts reset at midnight UTC and also whenever the server restarts
 *   (acceptable for a demo; use a DB/Redis-backed store for production).
 * - Requires `app.set("trust proxy", 1)` so req.ip reflects the real
 *   client IP behind Railway's proxy (X-Forwarded-For).
 */

type Entry = { count: number; day: string };

const hits = new Map<string, Entry>();

const MAX_PER_DAY = Number(process.env.TRYON_DAILY_LIMIT ?? 5);

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10); // e.g. "2026-07-19"
}

// Hourly cleanup of stale entries so the map never grows unbounded.
setInterval(
  () => {
    const day = todayUtc();
    for (const [ip, entry] of hits) {
      if (entry.day !== day) hits.delete(ip);
    }
  },
  60 * 60 * 1000,
).unref();

export function dailyIpRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const ip = req.ip ?? "unknown";
  const day = todayUtc();

  let entry = hits.get(ip);
  if (!entry || entry.day !== day) {
    entry = { count: 0, day };
    hits.set(ip, entry);
  }

  if (entry.count >= MAX_PER_DAY) {
    logger.warn({ ip, count: entry.count }, "Daily try-on limit reached");
    res.status(429).json({
      error: `Dagelijkse limiet bereikt (${MAX_PER_DAY} pogingen per dag). Probeer het morgen opnieuw.`,
    });
    return;
  }

  entry.count += 1;
  next();
}
