"use client";

import React, { useEffect } from "react";
import axios from "@/utils/axios";
import { useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();
    const handleSubmit = (event: React.SyntheticEvent) => {
        event.preventDefault();
        axios
            .post("/api/login", {
                username: (event.target as any).username.value,
                password: (event.target as any).password.value,
            })
            .then((res) => {
                console.log(res.data.data.token);
                router.push("/dashboard/main");
            })
            .catch((err) => {
                console.log("Unsuccessful login");
            });
    };

    useEffect(() => {
        axios
            .get("/api/dashboard")
            .then((res) => {
                router.push("/dashboard/main");
            })
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            className="flex flex-col w-screen h-screen justify-center align-middle items-center"
            style={{
                backgroundImage:
                    "url('https://files.howlingmoon.dev/blog/4-31/1622420582680-__mare_s_ephemeral_hoshizora_no_memoria_drawn_by_shida_kazuhiro__0cf250230855799003be11b46aa4570d.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center center",
            }}
        >
            <form onSubmit={handleSubmit}>
                <div className="px-4 py-4 bg-slate-50 rounded-xl flex flex-col">
                    <p className="text-2xl font-light text-center mb-4">
                        Login
                    </p>
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
        </div>
    );
}
