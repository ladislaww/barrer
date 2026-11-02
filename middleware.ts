import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoginPage = req.nextUrl.pathname === "/admin/login";
  const isAdmin = req.auth?.user?.role === "ADMIN";

  if (!req.auth && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (req.auth && !isAdmin && !isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isAdmin && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"]
};
