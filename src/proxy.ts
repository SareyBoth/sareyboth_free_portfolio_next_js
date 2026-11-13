import { NextResponse, type NextRequest } from "next/server";

const PUBLISHED_HIGHLIGHT_SLUGS = new Set([
  "neighborhood-seed-library",
  "riverfront-oral-history-archive",
  "accessible-creek-trail-guide",
  "weekend-repair-cafe-handbook",
  "seasonal-fermentation-field-notes",
]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Guard unpublished highlights to ensure strict HTTP 404
  if (pathname.startsWith("/highlights/")) {
    const slug = pathname.replace("/highlights/", "").split("/")[0];
    if (slug && !PUBLISHED_HIGHLIGHT_SLUGS.has(slug)) {
      return NextResponse.rewrite(new URL("/_not-found", request.url), {
        status: 404,
      });
    }
  }

  // 2. Guard disabled journal section routes (disabled by default)
  if (pathname === "/journal" || pathname.startsWith("/journal/")) {
    return NextResponse.rewrite(new URL("/_not-found", request.url), {
      status: 404,
    });
  }

  // 3. Check for Better Auth session cookie
  const sessionCookie =
    request.cookies.get("openfolio.session_token") ||
    request.cookies.get("__Secure-openfolio.session_token");

  const isAuthenticated = Boolean(sessionCookie && sessionCookie.value);

  // 3. Protect /dashboard and /preview
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/preview")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      const returnTo = `${pathname}${search}`;
      if (returnTo !== "/dashboard") {
        loginUrl.searchParams.set("returnTo", returnTo);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Redirect authenticated users away from /login
  if (pathname === "/login") {
    if (isAuthenticated) {
      const returnTo = request.nextUrl.searchParams.get("returnTo");
      const target = returnTo && returnTo.startsWith("/") ? returnTo : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/highlights/:path*",
    "/journal",
    "/journal/:path*",
    "/dashboard/:path*",
    "/preview/:path*",
    "/login",
  ],
};
