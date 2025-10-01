import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import RedirectWrapper from "./RedirectWrapper";

export const metadata: Metadata = {
    title: "Howling Admin",
    description: "Admin Dashboard for Howling Blog",
};

export default async function Page() {
    const session = await getServerSession(authOptions);
    if (session) {
        redirect("/admin/main");
    }

    const config = await prisma.config.findFirst({
        where: {
            key: "LOGIN_BACKGROUND_IMAGE",
        },
    });

    return (
        <div
            className="flex flex-col w-screen h-screen justify-center align-middle items-center"
            style={{
                backgroundImage: `url('${config?.value}')`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
            }}
        >
            <RedirectWrapper />
        </div>
    );
}
