import { z } from "zod";

export const DeleteAssetRequestParams = z.object({
    key: z.string(),
});

export type TDeleteAssetRequestParams = z.infer<
    typeof DeleteAssetRequestParams
>;
