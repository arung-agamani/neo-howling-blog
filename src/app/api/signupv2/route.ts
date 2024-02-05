import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BadRequest, UnprocessableEntity } from "../responses";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { CreateUser, UserByUsername } from "@/lib/User";
import prisma from "@/utils/prisma";
import { SignupRequestBody } from "@/types";

export async function POST(request: NextRequest) {
    const isAllowUserCreation = await prisma.config.findFirst({
        where: {
            key: "ALLOW_USER_CREATION",
        },
    });
    if (isAllowUserCreation && isAllowUserCreation.value === "FALSE") {
        return UnprocessableEntity({
            message: "Unable to signup (disabled)",
        });
    }
    const req = await request.json();
    const validated = SignupRequestBody.safeParse(req);
    if (!validated.success)
        return BadRequest({
            message: "Validation error",
            issues: validated.error.issues,
        });

    const { username, password } = validated.data;
    const user = await UserByUsername(username);
    if (user) return BadRequest({ message: "User already exist" });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await CreateUser(username, hashedPassword);

    const token = jwt.sign(newUser, process.env["JWT_SECRET"], {
        expiresIn: "24h",
    });

    return NextResponse.json(
        {
            message: "user created",
            data: {
                token,
                authorization_type: "Bearer",
            },
        },
        {
            status: 201,
            headers: {
                "set-cookie": `token=${token}; path=/; samesite=lax;`,
            },
        }
    );
}
