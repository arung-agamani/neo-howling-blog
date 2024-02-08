import { Unauthorized } from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import { ListUsers } from "@/lib/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }
    const users = await ListUsers();
    return NextResponse.json({
        users,
    });
}
