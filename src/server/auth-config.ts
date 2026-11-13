import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "./prisma-client";
import { sendPasswordResetEmail } from "./email";
import dotenv from "dotenv";

dotenv.config();

const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  "openfolio-development-secret-key-at-least-32-chars-long-123456";
const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: authSecret,
  baseURL,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3100",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3100",
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      try {
        await sendPasswordResetEmail({
          to: user.email,
          resetUrl: url,
        });
      } catch (error) {
        console.error("Failed to send password reset email via SMTP:", error);
      }
    },
  },
  plugins: [
    admin({
      defaultRole: "EDITOR",
      adminRole: "OWNER",
    }),
  ],
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  advanced: {
    cookiePrefix: "openfolio",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
