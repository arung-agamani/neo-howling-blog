import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/utils/prisma";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Login from "./Login";

export const metadata: Metadata = {
    title: "Login",
    description: "Login page",
};

export default async function Page() {
    const session = await getServerSession(authOptions);
    if (session) {
        redirect("/dashboard/main");
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
            <Login />
        </div>
    );
}
