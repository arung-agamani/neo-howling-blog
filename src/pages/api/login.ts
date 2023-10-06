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

    const user = await prisma.users.findFirst({
        where: {
            username,
        },
    });

    if (!user) {
        return res.status(404).json({
            message: "No user found",
        });
    }

    if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({
            message: "Wrong password",
        });
    }

    const token = jwt.sign(
        {
            username: username,
            role: user.role,
            name: user.name,
            birthday: user.birthday,
            gender: user.gender,
            phone: user.phone,
        },
        process.env["JWT_SECRET"],
        {
            expiresIn: "2h",
        }
    );

    await prisma.users.update({
        where: {
            id: user.id,
        },
        data: {
            lastAccess: new Date(),
        },
    });

    return res
        .setHeader("set-cookie", `token=${token}; path=/; samesite=lax;`)
        .json({
            message: "Logged in!",
            data: {
                token,
            },
        });
});

export default router.handler({
    onError: (err, req, res) => {
        console.error(err);
        res.status(500).json({
            message: "Hawawawawa~!! Something went wrong!",
        });
    },
    onNoMatch: (req, res) => {
        res.status(404).json({
            message: "Something you are looking isn't here",
        });
    },
});
