-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNumber" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterTeamId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "otherCategoryDescription" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedTeamId" TEXT,
    "assignedUserId" TEXT,
    "deviceId" TEXT,
    "otherDeviceDescription" TEXT,
    "resolvedAt" DATETIME,
    "autoCloseAt" DATETIME,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_requesterTeamId_fkey" FOREIGN KEY ("requesterTeamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_assignedTeamId_fkey" FOREIGN KEY ("assignedTeamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("assignedTeamId", "assignedUserId", "autoCloseAt", "categoryId", "closedAt", "createdAt", "description", "deviceId", "id", "otherCategoryDescription", "otherDeviceDescription", "priority", "requesterId", "resolvedAt", "status", "subject", "ticketNumber", "updatedAt") SELECT "assignedTeamId", "assignedUserId", "autoCloseAt", "categoryId", "closedAt", "createdAt", "description", "deviceId", "id", "otherCategoryDescription", "otherDeviceDescription", "priority", "requesterId", "resolvedAt", "status", "subject", "ticketNumber", "updatedAt" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");
CREATE INDEX "Ticket_requesterId_idx" ON "Ticket"("requesterId");
CREATE INDEX "Ticket_requesterTeamId_idx" ON "Ticket"("requesterTeamId");
CREATE INDEX "Ticket_assignedTeamId_idx" ON "Ticket"("assignedTeamId");
CREATE INDEX "Ticket_assignedUserId_idx" ON "Ticket"("assignedUserId");
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
