import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BadRequest } from "../responses";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { CreateUser, UserByUsername } from "@/lib/User";

const SignupRequestBody = z.object({
    username: z.string(),
    password: z.string(),
});

type SignupRequestBody = z.infer<typeof SignupRequestBody>;

export async function POST(request: NextRequest) {
    const req = await request.json();
    const validated = SignupRequestBody.safeParse(req);
    if (!validated.success) return BadRequest();

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
