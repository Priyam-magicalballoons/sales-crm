import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/", "/analytics", "/clients", "/settings"];

export default function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;
  const pathname = req.nextUrl.pathname;

  // Logged in user should not see login
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Protected route without token
  if (PROTECTED_ROUTES.includes(pathname) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
