import { NextRequest, NextResponse } from "next/server";

// We do auth checks in individual Server Components using requireAuth()
// Middleware just handles basic redirect logic
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // These are handled by individual pages already
  // Middleware is minimal — just pass through
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
