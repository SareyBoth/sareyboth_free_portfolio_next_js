import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma-client";
import { z } from "zod";


const contactSubmissionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email is required").max(200),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(5000),
  // Honeypot field — bots fill this in
  hp_website: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Honeypot check: If the hidden honeypot field is filled, silently discard spam
    if (body.hp_website && body.hp_website.trim().length > 0) {
      return NextResponse.json(
        { message: "Message received! Thank you for reaching out." },
        { status: 200 }
      );
    }

    // 2. Validate fields
    const parsed = contactSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: details }, { status: 400 });
    }

    const { name, email, subject, message } = parsed.data;

    // 3. Extract IP for rate limiting / logging
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // 4. Rate limiting: max 5 messages per 15 minutes per IP
    const rateLimitKey = `contact:${ip}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;

    const rateEntry = await prisma.rateLimit.findUnique({
      where: { key: rateLimitKey },
    });

    if (rateEntry) {
      const timeDiff = now - Number(rateEntry.lastRequest);
      if (timeDiff < windowMs) {
        if (rateEntry.count >= 5) {
          return NextResponse.json(
            { error: "Too many messages sent. Please try again later." },
            { status: 429 }
          );
        }
        await prisma.rateLimit.update({
          where: { key: rateLimitKey },
          data: {
            count: { increment: 1 },
            lastRequest: BigInt(now),
          },
        });
      } else {
        await prisma.rateLimit.update({
          where: { key: rateLimitKey },
          data: {
            count: 1,
            lastRequest: BigInt(now),
          },
        });
      }
    } else {
      await prisma.rateLimit.create({
        data: {
          key: rateLimitKey,
          count: 1,
          lastRequest: BigInt(now),
        },
      });
    }

    // 5. Save to database
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        status: "unread",
        ipAddress: ip,
      },
    });

    // 6. Return generic safe response
    return NextResponse.json(
      { message: "Message received! Thank you for reaching out." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[contact-submission-error]", error);
    return NextResponse.json(
      { error: "Failed to submit contact message. Please try again." },
      { status: 500 }
    );
  }
}
