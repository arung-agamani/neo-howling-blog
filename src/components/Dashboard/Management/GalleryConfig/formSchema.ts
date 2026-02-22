import { z } from "zod";

export const FormSchema = z
    .object({
        backgroundType: z.enum(["color", "image"]),
        color: z.string(),
        imageUrl: z.string(),
        size: z.string(),
        position: z.string(),
        repeat: z.enum(["no-repeat", "repeat", "repeat-x", "repeat-y"]),
        attachment: z.enum(["scroll", "fixed", "local"]),
        overlayEnabled: z.boolean(),
        overlayColor: z.string(),
    })
    .superRefine((data, ctx) => {
        if (data.backgroundType === "image" && !data.imageUrl) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Image URL is required",
                path: ["imageUrl"],
            });
        }
    });

export type GalleryConfigFormValues = z.infer<typeof FormSchema>;
