import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/utils/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const PasswordChangeSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(32, "Password must be at most 32 characters")
            .regex(
                /^[A-Za-z0-9@]+$/,
                "Password should only be alphanumeric and the @ symbol",
            ),
        confirmNewPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Passwords don't match",
        path: ["confirmNewPassword"],
    });

export async function POST(req: NextRequest) {
    try {
        // Verify user is authenticated
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });
        if (!token || !token.email) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 },
            );
        }

        // Parse and validate request body
        const body = await req.json();
        const validation = PasswordChangeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    errors: validation.error.flatten().fieldErrors,
                },
                { status: 400 },
            );
        }

        const { currentPassword, newPassword } = validation.data;

        // Find the user
        const user = await prisma.users.findFirst({
            where: { email: token.email },
            select: {
                id: true,
                password: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 },
            );
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password,
        );

        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { success: false, message: "Current password is incorrect" },
                { status: 400 },
            );
        }

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "New password must be different from current password",
                },
                { status: 400 },
            );
        }

        // Hash new password and update
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await prisma.users.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Password change error:", error);
        return NextResponse.json(
            { success: false, message: "An error occurred while changing password" },
            { status: 500 },
        );
    }
}
