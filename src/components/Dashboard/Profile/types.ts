import { z } from "zod";

// Gender options matching the Prisma enum
export const GenderOptions = ["male", "female"] as const;
export type Gender = (typeof GenderOptions)[number];

// Profile update schema for form validation
export const ProfileUpdateSchema = z.object({
    name: z.string().max(100, "Name must be at most 100 characters").optional(),
    birthday: z.string().optional(),
    gender: z.enum(GenderOptions).optional(),
    phone: z
        .string()
        .max(20, "Phone number must be at most 20 characters")
        .optional(),
    bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
    avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type TProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

// Password change schema
export const PasswordChangeSchema = z
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
        confirmNewPassword: z.string().min(1, "Please confirm your new password"),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Passwords don't match",
        path: ["confirmNewPassword"],
    });

export type TPasswordChange = z.infer<typeof PasswordChangeSchema>;

// Profile section props
export interface ProfileSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

// User stats
export interface UserStats {
    postsCount: number;
    snippetsCount: number;
    assetsCount: number;
}
