import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isAdmin = req.auth?.user?.role === "ADMIN";

    const pathname = req.nextUrl.pathname;

    const isAuthRoute = pathname.startsWith("/login");
    const isAdminRoute = pathname.startsWith("/admin");
    const isPrivateRoute =
        pathname.startsWith("/perfil") ||
        pathname.startsWith("/configuracoes") ||
        pathname.startsWith("/favoritos") ||
        pathname.startsWith("/alertas") ||
        pathname.startsWith("/planos");

    // Redirect unauthenticated users to login for admin or private routes
    if ((isAdminRoute || isPrivateRoute) && !isLoggedIn) {
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
