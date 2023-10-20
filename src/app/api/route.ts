import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    return NextResponse.json({
        appName: "Howling Blog",
        secretCode: "kyuuketsukinoashiwonametai",
        version: "0.0.1",
    });
}
