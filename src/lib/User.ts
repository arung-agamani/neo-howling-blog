import prisma from "@/utils/prisma";

export async function UserByUsername(username: string) {
    const user = await prisma.users.findFirst({ where: { username } });
    return user;
}

export async function ListUsers() {
    const users = await prisma.users.findMany({
        select: {
            username: true,
            email: true,
            role: true,
            dateCreated: true,
            lastAccess: true,
        },
    });
    return users;
}

export async function CreateUser(
    username: string,
    password: string,
    role: string = "user"
) {
    const user = await prisma.users.create({
        data: {
            username,
            password,
            email: username,
            role,
            dateCreated: new Date(),
            lastAccess: new Date(),
        },
    });
    return user;
}
