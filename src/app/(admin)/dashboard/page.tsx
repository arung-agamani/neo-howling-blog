import prisma from "@/utils/prisma";
import Login from "./Login";

export default async function Page() {
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
