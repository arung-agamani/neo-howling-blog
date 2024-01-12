"use client";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function DarkModeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const currentTheme = theme;

    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) return null;
    return (
        <div>
            <button
                suppressHydrationWarning
                className=" bg-gray-400 p-2"
                onClick={() =>
                    theme == "dark" ? setTheme("light") : setTheme("dark")
                }
            >
                {currentTheme}
            </button>
        </div>
    );
}
