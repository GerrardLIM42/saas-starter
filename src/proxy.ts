import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/studio", "/credits", "/billing", "/settings", "/tools"];

// 로그인한 사용자만 접근 가능한 영역(사이드바 앱 셸 하위 전체). 그 외 경로는 통과.
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL("/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/studio/:path*",
    "/credits/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/tools/:path*",
  ],
};
