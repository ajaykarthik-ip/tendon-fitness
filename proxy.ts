import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth-token";

const PUBLIC_PAGES = new Set(["/login"]);
const PUBLIC_API = new Set(["/api/auth/login"]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) return true;
  if (PUBLIC_API.has(pathname)) return true;
  return false;
}

function tokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return req.cookies.get(AUTH_COOKIE)?.value ?? null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const payload = await verifyToken(tokenFromRequest(req));
  if (payload) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and static files
  matcher: ["/((?!_next/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$).*)"],
};
