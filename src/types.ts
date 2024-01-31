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
