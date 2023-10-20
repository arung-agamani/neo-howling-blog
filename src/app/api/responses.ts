import { NextResponse } from "next/server";

export function NotFound(body?: any) {
    return NextResponse.json(body || { message: "Resource not found" }, {
        status: 404,
    });
}

export function BadRequest(body?: any) {
    return NextResponse.json(body || { message: "Bad request" }, {
        status: 400,
    });
}

export function Unauthorized(body?: any) {
    return NextResponse.json(body || { message: "Incorrect credentials" }, {
        status: 401,
    });
}
