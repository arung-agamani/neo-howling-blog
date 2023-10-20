import { BadRequest, NotFound } from "@/app/api/responses";
import { UserByUsername } from "@/lib/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");
    if (!username) return BadRequest();
    const user = await UserByUsername(username);
    if (!user) return NotFound();
    return NextResponse.json(user);
}
