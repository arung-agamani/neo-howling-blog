"use client";

import axios from "@/utils/axios";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface UserCred {
    user: {
        role?: string;
        username: string;
    };
}

export default function Page() {
    const [user, setUser] = useState<UserCred | null>(null);
    const [stats, setStats] = useState<any>({ total: -1, unpublished: -1 });
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get("/api/hello", {
                    withCredentials: true,
                });
                console.log(data);
                setUser(data);
            } catch (error) {
                if (error instanceof AxiosError) {
                    const e = error as AxiosError<{ message: string }>;
                    toast.error(
                        e.response?.data.message ||
                            "Error when fetching user credentials"
                    );
                }
            }
        })();
        (async () => {
            try {
                const { data } = await axios.get("/api/dashboard", {
                    withCredentials: true,
                });
                setStats(data.stats);
            } catch (error) {
                if (error instanceof AxiosError) {
                    const e = error as AxiosError<{ message: string }>;
                    toast.error(
                        e.response?.data.message ||
                            "Error when fetching statistics"
                    );
                }
            }
        })();

        return () => {
            setUser(null);
        };
    }, []);
    if (!user) return <p>Fetching data...</p>;
    return (
        <div className="px-2 py-2">
            <h1 className="text-4xl">Hello, {user.user.username}!</h1>
            <p>Role: {user.user.role}</p>
            <p className="text-xl">Last Login: {new Date().toLocaleString()}</p>
            <p className="text-xl">
                You have {stats.total} posts, {stats.total - stats.unpublished}{" "}
                published, {stats.unpublished} draft
            </p>

            <br />
            <h2 className="text-2xl">Analytics</h2>
            <p className="mb-8">No data</p>
            <h2 className="text-2xl">Users</h2>
            <p className="mb-8">No data</p>
            <h2 className="text-2xl">Comments</h2>
            <p className="mb-8">No data</p>
        </div>
    );
}
