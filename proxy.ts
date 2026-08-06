import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Protection for Admin routes
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/experts/:path*",
    "/courses/:path*",
    "/analysis/:path*",
    "/admin/:path*",
    "/batches/:path*",
    "/modules/:path*",
    "/session-notes/:path*",
    "/recycle-bin/:path*",
    "/prep/:path*",
  ],
};
