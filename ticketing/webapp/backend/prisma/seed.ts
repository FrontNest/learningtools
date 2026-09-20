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

  const other = await prisma.category.upsert({
    where: { code: "OTHER" },
    update: {},
    create: { code: "OTHER", name: "Other" },
  });

  async function seedCategoryGroup(parentId: string, code: string, name: string, children: string[]) {
    const group = await prisma.category.upsert({
      where: { code },
      update: {},
      create: { code, name, parentId },
    });
    for (const child of children) {
      await prisma.category.upsert({
        where: { code: `${code}.${child.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}` },
        update: {},
        create: {
          code: `${code}.${child.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
          name: child,
          parentId: group.id,
        },
      });
    }
  }

  await seedCategoryGroup(hw.id, "HW.COMPUTER", "Laptop / Desktop", [
    "Won't turn on", "Slow performance", "Blue screen / system error", "Overheating", "Battery problem", "Keyboard", "Touchpad / mouse", "Display / screen", "Charger / docking station",
  ]);
  await seedCategoryGroup(hw.id, "HW.MONITOR", "Monitor", [
    "No picture", "Flickering", "Cable problem", "Resolution problem", "Monitor replacement",
  ]);
  await seedCategoryGroup(hw.id, "HW.MOBILE", "Mobile phone / Tablet", [
    "Won't turn on", "Broken screen", "Battery", "Camera", "Microphone / speaker", "Mobile data", "SIM / eSIM",
  ]);
  await seedCategoryGroup(hw.id, "HW.PRINTER", "Printer / Scanner", [
    "Does not print", "Paper jam", "Ink / toner", "Network connection", "Scanning problem", "Print quality",
  ]);
  await seedCategoryGroup(hw.id, "HW.NETWORK", "Network device", [
    "Wi-Fi access", "Cable / wall socket", "Switch / router", "VPN device",
  ]);
  await seedCategoryGroup(hw.id, "HW.PERIPHERAL", "Peripheral", [
    "Mouse", "Keyboard", "Headset", "Webcam", "Docking station", "USB device",
  ]);

  await seedCategoryGroup(sw.id, "SW.TEAMS", "Microsoft Teams", [
    "Login problem", "Audio problem", "Video problem", "Screen sharing", "Meeting problem", "Chat / messaging",
  ]);
  await seedCategoryGroup(sw.id, "SW.OUTLOOK", "Microsoft Outlook", [
    "Login problem", "Send / receive email", "Calendar", "Attachments", "Mailbox size", "Outlook slow / frozen",
  ]);
  await seedCategoryGroup(sw.id, "SW.M365", "Microsoft 365", [
    "Microsoft 365 login", "Word", "Excel", "PowerPoint", "OneDrive", "SharePoint",
  ]);
  await seedCategoryGroup(sw.id, "SW.WINDOWS", "Windows / Operating system", [
    "Login problem", "Updates", "System error", "Slow performance", "User profile", "Permissions",
  ]);
  await seedCategoryGroup(sw.id, "SW.APPLICATION", "Application / Program", [
    "Installation request", "License problem", "Application will not start", "Application freezes", "Incorrect behavior", "Update request",
  ]);
  await seedCategoryGroup(sw.id, "SW.NETWORK", "Network / VPN", [
    "No internet", "Wi-Fi connection", "VPN login", "VPN disconnects", "Internal website unavailable", "Network permissions",
  ]);
  await seedCategoryGroup(sw.id, "SW.ACCESS", "Access / Permissions", [
    "New user", "Access request", "Folder access", "Application access", "Shared mailbox", "Group membership",
  ]);
  await seedCategoryGroup(sw.id, "SW.SECURITY", "Security", [
    "Suspicious email", "Phishing suspicion", "Lost or stolen device", "Password problem", "Multi-factor authentication", "Virus / malware suspicion", "Security incident",
  ]);

  await seedCategoryGroup(other.id, "OTHER.REQUEST", "Other IT request", [
    "New device request", "Device replacement", "Device return", "Joiner / leaver", "Employee transfer", "Software procurement", "Information request",
  ]);

  const defaultAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(defaultAdminPassword, 12);
  const masterPasswordHash = await bcrypt.hash(process.env.MASTER_USER_PASSWORD ?? "ItSdMaster", 12);

  await prisma.user.upsert({
    where: { email: "admin.master@company.example" },
    update: { isMaster: true, role: "ADMIN", active: true, mustChangePassword: false },
    create: {
      email: "admin.master@company.example",
      displayName: "Master Administrator",
      role: "ADMIN",
      isMaster: true,
      teamId: sd.id,
      passwordHash: masterPasswordHash,
      mustChangePassword: false,
    },
  });

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
