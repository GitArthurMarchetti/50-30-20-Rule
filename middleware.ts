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

  // checa sessão
  const token = req.cookies.get("sessionToken")?.value;
  const valid = token && (await verifyJwt(token));

  // Se for API e não estiver autenticado → 401 (não redireciona API)
  if (pathname.startsWith("/api") && !isPublicPath(pathname) && !valid) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Se for página e não estiver autenticado → redireciona pro /login
  if (!pathname.startsWith("/api") && !valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Autenticado → segue
  return NextResponse.next();
}

/**
 * Matcher:
 * - Usa negativa pra ignorar arquivos com extensão (jpg, css, js, etc.)
 * - Deixa o código acima decidir o que é público/privado.
 */
export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
