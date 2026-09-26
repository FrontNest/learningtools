import express from "express";
import "express-async-errors";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import fs from "fs";
import { env } from "./config";
import { prisma } from "./lib/prisma";
import { PrismaSessionStore } from "./lib/prismaSessionStore";
import { csrfProtection } from "./middleware/csrf";
import { apiRateLimiter } from "./middleware/rateLimiters";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { ticketsRouter } from "./routes/tickets";
import { categoriesRouter } from "./routes/categories";
import { teamsRouter } from "./routes/teams";
import { adminUsersRouter } from "./routes/adminUsers";
import { adminDevicesRouter } from "./routes/adminDevices";
import { adminAutoCloseRouter } from "./routes/adminAutoClose";
import { meDevicesRouter } from "./routes/meDevices";
import { notificationsRouter } from "./routes/notifications";
import { dashboardRouter } from "./routes/dashboard";
import { userManagementRouter } from "./routes/userManagement";
import { categoryManagementRouter } from "./routes/categoryManagement";
import { adminEmailSettingsRouter } from "./routes/adminEmailSettings";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  // Trust the reverse proxy (Fly.io / nginx / IIS ARR) for correct req.ip / secure cookie detection.
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // helmet's default CSP includes upgrade-insecure-requests, which makes
      // browsers force all subresource requests to HTTPS even when the page
      // itself was loaded over plain HTTP — breaks the LAN/HTTP-only demo.
      // Only keep it once the app is actually served over HTTPS.
      contentSecurityPolicy: env.cookieSecure
        ? undefined
        : { useDefaults: true, directives: { upgradeInsecureRequests: null } },
      crossOriginOpenerPolicy: env.cookieSecure ? undefined : false,
      originAgentCluster: env.cookieSecure ? undefined : false,
    })
  );
  app.use(
    cors({
      origin: env.frontendOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use(
    session({
      name: "sid",
      store: new PrismaSessionStore(prisma),
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: env.cookieSecure,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 8, // 8 hours
      },
    })
  );

  app.use(csrfProtection);
  app.use("/api", apiRateLimiter);

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/tickets", ticketsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/teams", teamsRouter);
  app.use("/api/admin/users", adminUsersRouter);
  app.use("/api/admin/devices", adminDevicesRouter);
  app.use("/api/admin/auto-close", adminAutoCloseRouter);
  app.use("/api/me/devices", meDevicesRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/admin/user-management", userManagementRouter);
  app.use("/api/admin/category-management", categoryManagementRouter);
  app.use("/api/admin/email-settings", adminEmailSettingsRouter);

  app.use("/api", notFoundHandler);

  // Optional single-origin deployment: serve the built React app (LAN demo,
  // a simple VM, or behind an IIS/nginx reverse proxy) so only one port/URL
  // needs to be shared/firewalled.
  if (env.frontendDistPath && fs.existsSync(env.frontendDistPath)) {
    app.use(express.static(env.frontendDistPath));
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(env.frontendDistPath!, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
}
