import { ZodError } from "zod";

export function FlattenErrors(error: ZodError) {
    const res: Record<string, any> = {};
    error.issues.forEach((x) => {
        res[`${x.path.join(".")}`] = x.code;
    });
    return res;
}
