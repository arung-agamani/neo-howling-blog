import { getRandomJoke } from "@/lib/JokesBapakBapak";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    const randomJoke = getRandomJoke();
    return NextResponse.json({
        success: true,
        data: randomJoke,
        errors: [],
    });
}
