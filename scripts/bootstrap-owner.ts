import readline from "node:readline";
import crypto from "node:crypto";
import { prisma } from "../src/server/prisma-client";
import { auth } from "../src/server/auth-config";

async function promptQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function generateSecurePassword(length = 16): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

export async function bootstrapOwner(options?: {
  email?: string;
  name?: string;
  password?: string;
  force?: boolean;
}): Promise<{
  created: boolean;
  email: string;
  temporaryPassword?: string;
  message: string;
}> {
  const existingOwner = await prisma.user.findFirst({
    where: { role: "OWNER" },
  });

  if (existingOwner && !options?.force) {
    return {
      created: false,
      email: existingOwner.email,
      message: `An OWNER account already exists (${existingOwner.email}). Use --force or specify new credentials if necessary.`,
    };
  }

  const name =
    options?.name ||
    process.env.INITIAL_OWNER_NAME ||
    "SareyBoth";

  const email =
    options?.email ||
    process.env.INITIAL_OWNER_EMAIL ||
    "sareyboth@example.com";

  let password =
    options?.password ||
    process.env.INITIAL_OWNER_PASSWORD;

  let generated = false;
  if (!password) {
    if (process.stdin.isTTY && !process.env.CI) {
      password = await promptQuestion(
        `Enter password for initial owner (${email}) [press Enter to generate random]: `
      );
    }
    if (!password) {
      password = generateSecurePassword(16);
      generated = true;
    }
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  // If existing owner and force, delete existing or update
  if (existingOwner && options?.force) {
    await prisma.user.delete({ where: { id: existingOwner.id } });
  }

  // Create owner via Better Auth API
  const newUser = await auth.api.createUser({
    body: {
      email,
      name,
      password,
      role: "OWNER" as any,
    },
  });

  if (!newUser || !newUser.user) {
    throw new Error("Failed to create owner user via Better Auth API.");
  }

  // Log in AuditLog
  await prisma.auditLog.create({
    data: {
      action: "bootstrap_owner",
      entityType: "user",
      entityId: newUser.user.id,
      actorEmail: email,
      details: {
        email,
        name,
        role: "OWNER",
        timestamp: new Date().toISOString(),
      },
    },
  });

  return {
    created: true,
    email,
    temporaryPassword: generated ? password : undefined,
    message: `Owner account created successfully for ${email} (${name}).`,
  };
}

if (process.argv[1] && process.argv[1].endsWith("bootstrap-owner.ts")) {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const emailArg = args.find((a) => a.startsWith("--email="))?.split("=")[1];
  const passArg = args.find((a) => a.startsWith("--password="))?.split("=")[1];
  const nameArg = args.find((a) => a.startsWith("--name="))?.split("=")[1];

  bootstrapOwner({
    force,
    email: emailArg,
    password: passArg,
    name: nameArg,
  })
    .then((res) => {
      console.log(res.message);
      if (res.temporaryPassword) {
        console.log("--------------------------------------------------");
        console.log(`Generated Password: ${res.temporaryPassword}`);
        console.log("Please save this password securely and change it after first login.");
        console.log("--------------------------------------------------");
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error("Bootstrap owner failed:", err);
      process.exit(1);
    });
}
