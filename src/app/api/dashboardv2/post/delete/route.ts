import { BadRequest, InternalServerError } from "@/app/api/responses";
import { DeletePost, HardDeletePost } from "@/lib/Post";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DeleteRequestParams = z.object({
  id: z.string(),
  hard: z.coerce.boolean().optional(),
});

type DeleteRequestParams = z.infer<typeof DeleteRequestParams>;
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");
  const hard = searchParams.get("hard");
  const validate = DeleteRequestParams.safeParse({
    id,
    hard,
  });
  if (!validate.success) {
    return BadRequest(validate.error.issues);
  }
  let deleteRes;
  if (validate.data.hard) {
    deleteRes = await HardDeletePost(validate.data.id);
  } else {
    deleteRes = await DeletePost(validate.data.id);
  }
  if (!deleteRes) return InternalServerError();

  if (validate.data.hard)
    return NextResponse.json({ message: "Post has been deleted (hard)" });
  return NextResponse.json({ message: "Post marked as deleted" });
}
