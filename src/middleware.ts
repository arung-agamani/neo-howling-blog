import { getToken } from "next-auth/jwt";

import { withAuth } from "next-auth/middleware";

// export { default } from "next-auth/middleware";

export default withAuth(async function middleware(request) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });
    // console.log(`Login from ${token?.email} at ${new Date().toLocaleString()}`);
});

export const config = {
    matcher: ["/dashboard/(.*)", "/api/dashboardv2(.*)"],
};
