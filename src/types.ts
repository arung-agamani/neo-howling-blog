import { isAlpha } from "validator";
import { z } from "zod";

export const DeleteAssetRequestParams = z.object({
    key: z.string(),
});

export type TDeleteAssetRequestParams = z.infer<
    typeof DeleteAssetRequestParams
>;

export const GeneratePUTSignedURLParams = z.object({
    prefix: z.string(),
    filename: z.string().nonempty(),
    mime: z.string().nonempty().optional(),
});

export type TGeneratePUTSignedURLParams = z.infer<
    typeof GeneratePUTSignedURLParams
>;

export const GeneratePUTSignedURLResponse = z.discriminatedUnion("success", [
    z.object({
        success: z.literal(true),
        message: z.string(),
        signedUrl: z.string(),
    }),
    z.object({
        success: z.literal(false),
        message: z.string(),
        errors: z.record(z.any()),
    }),
]);

export type TGeneratePUTSignedURLResponse = z.infer<
    typeof GeneratePUTSignedURLResponse
>;

export const DirectoryListingItem = z.object({
    id: z.string(),
    name: z.string(),
    modDate: z.string().optional(),
    size: z.number().optional(),
    isDir: z.boolean().optional(),
});

export type TDirectoryListingItem = z.infer<typeof DirectoryListingItem>;

export const RenameAssetParams = z.object({
    source: z.string(),
    target: z.string(),
});

export type TRenameAssetParams = z.infer<typeof RenameAssetParams>;

export const RenameAssetResponse = z.discriminatedUnion("success", [
    z.object({
        success: z.literal(true),
        source: z.string(),
        target: z.string(),
        message: z.string(),
    }),
    z.object({
        success: z.literal(false),
        message: z.string(),
    }),
]);
export type TRenameAssetResponse = z.infer<typeof RenameAssetResponse>;

export const LoginParams = z.object({
    username: z
        .string()
        .min(6)
        .max(32)
        .refine((val) => isAlpha(val), "Username should only be alphabet"),
    password: z
        .string()
        .regex(
            new RegExp("[A-Za-z0-9@]{8,32}"),
            "Password should only be alphanumeric and the following symbols: @",
        )
        .max(32, "Maximum length is 32 characters")
        .min(8, "Minimum length is 8 characters"),
});

export type TLoginParams = z.infer<typeof LoginParams>;

export const SignupRequestBody = z
    .object({
        username: z.string().min(6).max(32),
        password: z
            .string()
            .regex(
                new RegExp("[A-Za-z0-9@]{8,32}"),
                "Password should only be alphanumeric and the following symbols: @",
            )
            .max(32, "Maximum length is 32 characters")
            .min(8, "Minimum length is 8 characters"),
        confirmPassword: z
            .string()
            .regex(new RegExp("[A-Za-z0-9@]{8,32}"))
            .max(32, "Maximum length is 32 characters")
            .min(8, "Minimum length is 8 characters"),
    })
    .superRefine((val, ctx) => {
        if (val.password !== val.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                message: "Passwords don't match",
                path: ["confirmPassword"],
            });
        }

        if (!isAlpha(val.username)) {
            ctx.addIssue({
                code: "custom",
                message: "Username should only be alphabet",
                path: ["username"],
            });
        }
    });

export type TSignupRequestBody = z.infer<typeof SignupRequestBody>;

export const UserRoles = z.enum(["user", "admin", "editor", "guest"]);
export type TUserRoles = z.infer<typeof UserRoles>;

export const UserSchema = z.object({
    username: z.string(),
    email: z.string(),
    role: z.string(),
    dateCreated: z.date(),
    lastAccess: z.date(),
});

export type TUserSchema = z.infer<typeof UserSchema>;

export const UpdateUserPayload = z.object({
    username: z.string(),
    role: UserRoles,
});
export type TUpdateUserPayload = z.infer<typeof UpdateUserPayload>;
export const UpdateUserResponse = z.discriminatedUnion("success", [
    z.object({
        success: z.literal(true),
        updated: z.number(),
    }),
    z.object({
        success: z.literal(false),
        message: z.string(),
    }),
]);
export type TUpdateUserResponse = z.infer<typeof UpdateUserResponse>;
