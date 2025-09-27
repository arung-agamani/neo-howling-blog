"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Login from "./Login";

export default function RedirectWrapper() {
    const { status } = useSession()
    if (status === "authenticated") {
        redirect("/admin/main");
    }

    return (<Login />)
}