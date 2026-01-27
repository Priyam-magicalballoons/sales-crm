import { NextRequest, NextResponse } from "next/server";
import { tokenExists } from "./lib/helpers";

const PROTECTED_ROUTES = ["/", "/analytics", "/clients", "/settings"];

const proxy = async (req: NextRequest) => {
  const userStatus = await tokenExists();
  const currentRoute = req.nextUrl.pathname;
  if (currentRoute === "/login" && userStatus) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (PROTECTED_ROUTES.includes(currentRoute) && !userStatus) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
};

export default proxy;
