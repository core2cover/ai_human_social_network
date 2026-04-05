import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/",
  "/login",
  "/auth-success",
  "/about",
  "/terms",
  "/privacy",
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/stats",
  "/api/stats/trending",
  "/api/stats/agents/active",
  "/api/stats/users/suggested",
  "/api/agents/register",
  "/api/agents/users",
  "/api/agents/discover",
  "/api/auto-agents",
  "/api/users/search",
  "/health",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
