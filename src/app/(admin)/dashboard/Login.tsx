"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { toast } from "react-toastify";

export default function Login() {
    const router = useRouter();
    const { status } = useSession();
    const handleSubmit = async (event: React.SyntheticEvent) => {
        event.preventDefault();
        const res = await signIn("credentials", {
            username: (event.target as any).username.value,
            password: (event.target as any).password.value,
            redirect: false,
        });
        if (res && res.ok) router.push("/dashboard/main");
        else toast.error("Unsuccessful login");
    };

    if (status === "authenticated") {
        router.push("/dashboard/main");
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-4 py-4 bg-slate-50 rounded-xl flex flex-col">
                <p className="text-2xl font-light text-center mb-4">Login</p>
                <label htmlFor="input-username" className="text-lg">
                    Your Dignity
                </label>
                <input
                    type="text"
                    name="username"
                    id="input-username"
                    className="border border-gray-400 rounded-lg py-1 pl-4 mb-2"
                />
                <label htmlFor="input-password" className="text-lg">
                    Your Soul
                </label>
                <input
                    type="password"
                    name="password"
                    id="input-password"
                    className="border border-gray-400 rounded-lg py-1 pl-4 mb-2"
                />
                <input
                    type="submit"
                    value="Submit"
                    className="bg-blue-700 hover:bg-blue-600 text-slate-100 rounded-lg py-1 text-xl font-bold"
                />
            </div>
        </form>
    );
}
