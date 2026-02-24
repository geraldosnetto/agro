import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isAdmin = req.auth?.user?.role === "ADMIN";
    const isAuthRoute = req.nextUrl.pathname.startsWith("/login");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

    // Redirect unauthenticated users to login for admin routes
    if (isAdminRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    // Redirect non-admin users to dashboard if they try to access admin
    if (isAdminRoute && isLoggedIn && !isAdmin) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
