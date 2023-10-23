import { BadRequest } from "@/app/api/responses";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { id, op, content, tags } = body;

    if (!op) return BadRequest();

    if (op === "update") {
        if (!id || !content) return BadRequest();
        const { title, description, bannerUrl } = body;
        let updateRes;
        try {
        } catch (error) {}
    }
}
