import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const sd = await prisma.team.upsert({
    where: { name: "SD" },
    update: {},
    create: { name: "SD", type: "IT_TEAM" },
  });
  const l2 = await prisma.team.upsert({
    where: { name: "L2" },
    update: {},
    create: { name: "L2", type: "IT_TEAM" },
  });

  const hw = await prisma.category.upsert({
    where: { code: "HW" },
    update: {},
    create: { code: "HW", name: "Hardware" },
  });
  const sw = await prisma.category.upsert({
    where: { code: "SW" },
    update: {},
    create: { code: "SW", name: "Software" },
  });

  const hwPhone = await prisma.category.upsert({
    where: { code: "HW.PHONE" },
    update: {},
    create: { code: "HW.PHONE", name: "Phone", parentId: hw.id },
  });
  await prisma.category.upsert({
    where: { code: "HW.PHONE.BROKEN_SCREEN" },
    update: {},
    create: { code: "HW.PHONE.BROKEN_SCREEN", name: "Broken screen", parentId: hwPhone.id },
  });
  await prisma.category.upsert({
    where: { code: "HW.PHONE.BATTERY" },
    update: {},
    create: { code: "HW.PHONE.BATTERY", name: "Battery", parentId: hwPhone.id },
  });
  await prisma.category.upsert({
    where: { code: "HW.PHONE.OTHER" },
    update: {},
    create: { code: "HW.PHONE.OTHER", name: "Other", parentId: hwPhone.id },
  });

  const swTeams = await prisma.category.upsert({
    where: { code: "SW.TEAMS" },
    update: {},
    create: { code: "SW.TEAMS", name: "Teams", parentId: sw.id },
  });
  await prisma.category.upsert({
    where: { code: "SW.TEAMS.LOGIN" },
    update: {},
    create: { code: "SW.TEAMS.LOGIN", name: "Login problem", parentId: swTeams.id },
  });
  await prisma.category.upsert({
    where: { code: "SW.TEAMS.AUDIO" },
    update: {},
    create: { code: "SW.TEAMS.AUDIO", name: "Audio problem", parentId: swTeams.id },
  });
  await prisma.category.upsert({
    where: { code: "SW.TEAMS.OTHER" },
    update: {},
    create: { code: "SW.TEAMS.OTHER", name: "Other", parentId: swTeams.id },
  });

  const defaultAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(defaultAdminPassword, 12);

  await prisma.user.upsert({
    where: { email: "admin.sd@company.example" },
    update: {},
    create: {
      email: "admin.sd@company.example",
      displayName: "SD Admin",
      role: "ADMIN",
      teamId: sd.id,
      passwordHash,
      mustChangePassword: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin.l2@company.example" },
    update: {},
    create: {
      email: "admin.l2@company.example",
      displayName: "L2 Admin",
      role: "ADMIN",
      teamId: l2.id,
      passwordHash,
      mustChangePassword: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "requester.demo@company.example" },
    update: {},
    create: {
      email: "requester.demo@company.example",
      displayName: "Demo Requester",
      role: "REQUESTER",
      passwordHash,
      mustChangePassword: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log("Seed completed. Default password for seeded users:", defaultAdminPassword);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
