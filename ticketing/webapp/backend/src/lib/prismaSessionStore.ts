import session from "express-session";
import type { PrismaClient } from "@prisma/client";

// Persistent session store backed by the same SQLite database via Prisma.
// Replaces express-session's default MemoryStore, which is explicitly
// unsuitable for production: unbounded memory growth and total session loss
// on every process restart/deploy.
export class PrismaSessionStore extends session.Store {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  get: session.Store["get"] = (sid, callback) => {
    this.prisma.session
      .findUnique({ where: { sid } })
      .then((row) => {
        if (!row || row.expiresAt.getTime() <= Date.now()) {
          callback(null, null);
          return;
        }
        callback(null, JSON.parse(row.data));
      })
      .catch((err) => callback(err));
  };

  set: session.Store["set"] = (sid, sessionData, callback) => {
    const expiresAt = sessionData.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + 1000 * 60 * 60 * 8);

    this.prisma.session
      .upsert({
        where: { sid },
        create: { sid, data: JSON.stringify(sessionData), expiresAt },
        update: { data: JSON.stringify(sessionData), expiresAt },
      })
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  };

  destroy: session.Store["destroy"] = (sid, callback) => {
    this.prisma.session
      .deleteMany({ where: { sid } })
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  };

  touch: session.Store["touch"] = (sid, sessionData, callback) => {
    const expiresAt = sessionData.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + 1000 * 60 * 60 * 8);

    this.prisma.session
      .updateMany({ where: { sid }, data: { expiresAt } })
      .then(() => callback?.())
      .catch(() => callback?.());
  };

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
    return result.count;
  }
}
