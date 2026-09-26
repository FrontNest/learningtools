-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "emailError" TEXT;
ALTER TABLE "Notification" ADD COLUMN "emailSentAt" DATETIME;
ALTER TABLE "Notification" ADD COLUMN "emailStatus" TEXT;

-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "clientId" TEXT,
    "clientSecretEnc" TEXT,
    "senderMailbox" TEXT,
    "updatedByEmail" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Notification_emailStatus_idx" ON "Notification"("emailStatus");
