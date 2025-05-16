import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export async function GET() {
    try {
        const tags = await prisma.tags.findMany({
            orderBy: { count: "desc" },
        });
        return NextResponse.json(tags);
    } catch (error) {
        console.error("Error fetching tags:", error);
        return NextResponse.json(
            { error: "Failed to fetch tags" },
            { status: 500 }
        );
    }
}
