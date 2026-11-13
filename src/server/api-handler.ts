import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError, ForbiddenError } from "./permissions";

export class ConflictError extends Error {
  constructor(message = "Resource has been modified by another session (409 Conflict)") {
    super(message);
    this.name = "ConflictError";
  }
}

export function handleApiError(error: any) {
  console.error("[api-error]", error);

  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message, conflict: true }, { status: 409 });
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    return NextResponse.json({ error: `Validation error: ${details}`, issues: error.issues }, { status: 400 });
  }

  const message = error?.message || "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
