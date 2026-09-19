import type { Prisma, PrismaClient } from "@prisma/client";
import { appConfig } from "../config";

type TxClient = Prisma.TransactionClient | PrismaClient;

// Concurrency-safe ticket number generation: increments a per-year counter
// row inside the caller's transaction. Format: TCK-YYYY-NNNNNNN.
export async function nextTicketNumber(tx: TxClient, year: number): Promise<string> {
  const sequence = await tx.ticketSequence.upsert({
    where: { year },
    update: { lastNumber: { increment: 1 } },
    create: { year, lastNumber: 1 },
  });

  return `${appConfig.ticketNumberPrefix}-${year}-${String(sequence.lastNumber).padStart(7, "0")}`;
}
