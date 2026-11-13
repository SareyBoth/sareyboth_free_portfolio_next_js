import "server-only";
import { headers } from "next/headers";
import { auth, type Session, type User } from "./auth";

export class AuthError extends Error {
  constructor(message = "Unauthorized: Authentication required", public statusCode = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Insufficient permissions", public statusCode = 403) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export type Role = "OWNER" | "EDITOR";

export type Permission =
  | "content:read"
  | "content:write"
  | "content:publish"
  | "settings:read"
  | "settings:write"
  | "users:manage"
  | "audit:read"
  | "data:transfer"
  | "messages:read"
  | "messages:manage";

const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  OWNER: new Set([
    "content:read",
    "content:write",
    "content:publish",
    "settings:read",
    "settings:write",
    "users:manage",
    "audit:read",
    "data:transfer",
    "messages:read",
    "messages:manage",
  ]),
  EDITOR: new Set([
    "content:read",
    "content:write",
    "settings:read",
    "messages:read",
    "messages:manage",
  ]),
};

export async function getSession(customHeaders?: Headers): Promise<{
  session: Session["session"];
  user: User;
} | null> {
  const reqHeaders = customHeaders ?? (await headers());
  const result = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!result || !result.session || !result.user) {
    return null;
  }

  // If user is banned, invalidate session
  if (result.user.banned) {
    return null;
  }

  return {
    session: result.session,
    user: result.user as User,
  };
}

export async function requireSession(customHeaders?: Headers): Promise<{
  session: Session["session"];
  user: User;
}> {
  const authContext = await getSession(customHeaders);
  if (!authContext) {
    throw new AuthError("Unauthorized: You must be signed in to perform this action", 401);
  }
  return authContext;
}

export async function requireRole(
  requiredRole: Role,
  customHeaders?: Headers
): Promise<{
  session: Session["session"];
  user: User;
}> {
  const { session, user } = await requireSession(customHeaders);
  const userRole = (user.role ?? "EDITOR").toUpperCase() as Role;

  if (requiredRole === "OWNER" && userRole !== "OWNER") {
    throw new ForbiddenError(
      "Only account owners have permission to perform this action",
      403
    );
  }

  return { session, user };
}

export async function requirePermission(
  permission: Permission,
  customHeaders?: Headers
): Promise<{
  session: Session["session"];
  user: User;
}> {
  const { session, user } = await requireSession(customHeaders);
  const userRole = (user.role ?? "EDITOR").toUpperCase() as Role;
  const permissions = ROLE_PERMISSIONS[userRole] ?? new Set();

  if (!permissions.has(permission)) {
    throw new ForbiddenError(
      `Permission denied: role '${userRole}' cannot perform '${permission}'`,
      403
    );
  }

  return { session, user };
}
