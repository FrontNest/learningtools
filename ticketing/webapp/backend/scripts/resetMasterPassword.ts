import "dotenv/config";
import readline from "readline";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/services/authService";
import { passwordPolicySchema } from "../src/domain/passwordPolicy";

// Local-only maintenance tool: resets the master account's password directly
// in the database. Intentionally NOT exposed via the web API/UI — if the
// master forgets their password, no other account is allowed to reset it
// remotely (that would defeat the master-only protections). Whoever can run
// this already has OS-level file access to the server, which is the correct
// trust boundary for this kind of break-glass recovery.
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(question);
    let value = "";

    const onData = (char: Buffer) => {
      const key = char.toString("utf8");
      switch (key) {
        case "\n":
        case "\r":
        case "\u0004":
          process.stdin.removeListener("data", onData);
          process.stdin.setRawMode?.(false);
          process.stdin.pause();
          process.stdout.write("\n");
          rl.close();
          resolve(value);
          break;
        case "\u0003": // Ctrl+C
          process.stdout.write("\n");
          process.exit(1);
          break;
        case "\u007f": // backspace
        case "\b":
          value = value.slice(0, -1);
          break;
        default:
          value += key;
      }
    };

    process.stdin.setRawMode?.(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

async function main() {
  console.log("=== ITSD Ticketing - master password reset (local server tool) ===");
  console.log("This directly updates the database and requires OS-level access to this server.\n");

  const master = await prisma.user.findFirst({ where: { isMaster: true } });
  if (!master) {
    console.error("No master account found in the database.");
    process.exitCode = 1;
    return;
  }
  console.log(`Master account: ${master.email}\n`);

  const newPassword = await promptHidden("New master password: ");
  const confirmPassword = await promptHidden("Confirm new password: ");

  if (newPassword !== confirmPassword) {
    console.error("\nPasswords do not match. Nothing was changed.");
    process.exitCode = 1;
    return;
  }

  const parsed = passwordPolicySchema.safeParse(newPassword);
  if (!parsed.success) {
    console.error(`\n${parsed.error.issues[0]?.message ?? "Password does not meet the policy."}`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: master.id },
    data: { passwordHash, mustChangePassword: true },
  });

  console.log("\nMaster password updated. It must be changed again on next login.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
