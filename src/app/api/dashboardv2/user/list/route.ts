import { ListUsers } from "@/lib/User";
import { NextResponse } from "next/server";

export async function GET() {
    const users = await ListUsers();
    return NextResponse.json({
        users,
    });
}
