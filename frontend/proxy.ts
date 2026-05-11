import { NextRequest, NextResponse } from "next/server";

const PROTECTED = [
  "/dashboard", "/chat", "/chat-history", "/mood",
  "/resources", "/urgenta", "/specialists", "/settings",
  "/profile", "/about", "/admin",
];

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-otp"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Accept either cookie — if only refresh_token exists, the client axios interceptor will renew access_token
  const hasSession = request.cookies.has("access_token") || request.cookies.has("refresh_token");

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|uploads|api).*)",
  ],
};
