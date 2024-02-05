import { getToken } from "next-auth/jwt";

import { withAuth } from "next-auth/middleware";

// export { default } from "next-auth/middleware";

// const routeByRoles: Record<string, string[]> = {
//     "/dashboard/main/profile": ["guest", "user", "editor", "admin"],
// };

export default withAuth(async function middleware(request) {
    const { pathname } = request.nextUrl;
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });
    // if (pathname.startsWith("/dashboard/main")) {
    //     if (!routeByRoles[pathname]?.includes(token?.role || "guest")) {
    //         const url = request.nextUrl.clone();
    //         url.pathname = "/dashboard/main";
    //         return NextResponse.rewrite(url);
    //     }
    // }
});

export const config = {
    matcher: ["/dashboard/(.*)", "/api/dashboardv2(.*)"],
};
