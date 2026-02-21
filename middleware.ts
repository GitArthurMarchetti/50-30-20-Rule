// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "./app/lib/jwt";



function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/api/login" ||
    pathname === "/api/register" ||
    pathname === "/api/csrf-token" || // Allow CSRF token endpoint
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/static")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // check session
  const token = req.cookies.get("sessionToken")?.value;
  const valid = token && (await verifyJwt(token));

  // If it's an API and not authenticated → 401 (don't redirect API)
  if (pathname.startsWith("/api") && !isPublicPath(pathname) && !valid) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // If it's a page and not authenticated → redirect to /login
  if (!pathname.startsWith("/api") && !valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated → continue
  return NextResponse.next();
}

/**
 * Matcher:
 * - Uses negative to ignore files with extensions (jpg, css, js, etc.)
 * - Lets the code above decide what is public/private.
 */
export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
