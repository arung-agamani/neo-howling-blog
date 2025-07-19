import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
    // Use NextAuth to get the session
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const email = token.email;

    const user = await prisma.users.findFirst({
        where: { email: email! },
        select: {
            id: true,
            username: true,
            name: true,
            role: true,
            birthday: true,
            gender: true,
            phone: true,
        },
    });
    if (!user) {
        return NextResponse.json(
            { message: "User not found" },
            { status: 404 }
        );
    }
    return NextResponse.json({
        user,
    });

    // Decode the token to get user information

    // const token = req.cookies.get("token")?.value;
    // if (!token) {
    //     return NextResponse.json({ message: "こんにちは！" }, { status: 200 });
    // }

    // try {
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    //     // Only expose safe fields
    //     const { username, role, name, birthday, gender, phone } =
    //         decoded as any;
    //     return NextResponse.json(
    //         {
    //             user: { username, role, name, birthday, gender, phone },
    //         },
    //         {
    //             status: 200,
    //             headers: {
    //                 "Cache-Control": "no-cache, no-store, must-revalidate",
    //                 Pragma: "no-cache",
    //                 Expires: "0",
    //             },
    //         }
    //     );
    // } catch (error) {
    //     const res = NextResponse.json(
    //         { message: "Invalid token. Cookie will be invalidated" },
    //         { status: 401 }
    //     );
    //     res.headers.set(
    //         "set-cookie",
    //         `token=asdf; path=/; samesite=lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    //     );
    //     return res;
    // }
}
