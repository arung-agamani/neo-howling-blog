import { NextResponse } from "next/server";

export function NotFound(body?: any) {
  return NextResponse.json(
    { message: "Resource not found", ...body },
    {
      status: 404,
    }
  );
}

export function BadRequest(body?: any) {
  return NextResponse.json(
    { message: "Bad request", ...body },
    {
      status: 400,
    }
  );
}

export function Unauthorized(body?: any) {
  return NextResponse.json(
    { message: "Incorrect credentials", ...body },
    {
      status: 401,
    }
  );
}

export function UnprocessableEntity(body?: any) {
  return NextResponse.json(
    {
      message: "Unprocessable entity",
      ...body,
    },
    {
      status: 409,
    }
  );
}

export function InternalServerError(body?: any) {
  return NextResponse.json(
    { message: "Incorrect credentials", ...body },
    {
      status: 500,
    }
  );
}
