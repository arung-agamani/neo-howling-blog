// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";

// type Data = {
//   name: string
// }

type UserCred = Omit<
    Prisma.usersSelect,
    "id" | "v" | "dateCreated" | "lastAccess"
>;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const token = req.cookies["token"];
    if (!token) {
        return res.status(200).json({
            message: "こんにちは！",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as UserCred;
        return res
            .status(200)
            .setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            .setHeader("Pragma", "no-cache")
            .setHeader("Expires", 0)
            .json({
                user: {
                    username: decoded.username,
                    role: decoded.role,
                    name: decoded.name,
                    birthday: decoded.birthday,
                    gender: decoded.gender,
                    phone: decoded.phone,
                },
            });
    } catch (error) {
        return res
            .status(401)
            .setHeader(
                "set-cookie",
                `token=asdf; path=/; samesite=lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`
            )
            .json({
                message: "Invalid token. Cookie will be invalidated",
            });
    }
}
