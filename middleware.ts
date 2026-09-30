import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";
import { isProtectedPath } from "@/lib/access";

// Optimistic check only: bounce visitors without a session cookie to sign-in early.
// The real authorisation (session validity + role) happens on the server in every
// protected page and server action via lib/auth/session.ts.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isProtectedPath(pathname) && !req.cookies.has(SESSION_COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = `?mode=login&next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/buyer/:path*", "/seller/:path*", "/admin/:path*", "/account/:path*", "/inquiries/:path*", "/orders/:path*"],
};
