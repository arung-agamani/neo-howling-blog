import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import prisma from "@/utils/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.post(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Bad request",
        });
    }

    const regex = new RegExp("^[a-zA-Z0-9_]*$");
    if (!regex.test(password)) {
        return res.status(400).json({
            message: "Invalid password. Must only be alphanumeric string",
        });
    }

    if (await prisma.users.findFirst({ where: { username } })) {
        return res.status(400).json({
            message: "User already exist",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
        data: {
            username,
            password: hashedPassword,
            dateCreated: new Date(),
            email: username,
            lastAccess: new Date(),
            role: "user",
        },
    });

    const token = jwt.sign(
        {
            username: username,
            role: "user",
        },
        process.env["JWT_SECRET"],
        {
            expiresIn: "2h",
        }
    );

    return res
        .status(201)
        .setHeader("set-cookie", `token=${token}; path=/; samesite=lax;`)
        .json({
            message: "success",
            data: {
                token,
                authorization_type: "Bearer",
            },
        });
});

export default router.handler();
