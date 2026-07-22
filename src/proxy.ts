import { auth } from "@/auth";
import { NextResponse } from "next/server";

// /dashboard, /studio 이하 경로는 로그인 필수. 그 외 경로는 통과.
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtected =
    req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/studio");

  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL("/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/studio/:path*"],
};
