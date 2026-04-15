import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextauth.token;
    const isAuth = !!token;
    const isLoginPage = req.nextUrl.pathname.startsWith("/login");

    const pathname = req.nextUrl.pathname;

    // Protection for Admin routes
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protection for Expert routes (future-proofing)
    // Team can see all, Experts can only see their own (this will be handled in page logic)

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
  ],
};
