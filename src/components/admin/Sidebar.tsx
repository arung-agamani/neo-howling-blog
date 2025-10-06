"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

import { cn } from "@/utils/index";
import { usePathname } from "next/navigation";
import { Home, Users, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserProfile from "./UserProfile";

// Sidebar navigation items config
const sidebarNav = [
    {
        label: "Dashboard",
        href: "/admin/main",
        icon: <Home className="w-4 h-4 mr-2" />,
    },
    {
        label: "Posts",
        href: "/admin/main/posts",
        icon: <FileText className="w-4 h-4 mr-2" />,
    },
    {
        label: "Users",
        href: "/admin/main/users",
        icon: <Users className="w-4 h-4 mr-2" />,
    },
    {
        label: "Settings",
        href: "/admin/main/settings",
        icon: <Settings className="w-4 h-4 mr-2" />,
    },
    {
        label: "Editor Demo",
        href: "/admin/main/editor",
        icon: <FileText className="w-4 h-4 mr-2" />,
    },
    {
        label: "Go to V1 Admin Dashboard",
        href: "/dashboard",
        icon: <Settings className="w-4 h-4 mr-2" />,
    },
    {
        label: "Go to V2 User Page",
        href: "/v2",
        icon: <Settings className="w-4 h-4 mr-2" />,
    },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();

    return (
        <nav className="flex-1 overflow-y-auto">
            <div className="flex flex-col space-y-1 p-4">
                {sidebarNav.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground w-full",
                            pathname === item.href
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground",
                        )}
                        onClick={onNavigate}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}

// ...rest of imports remain unchanged...

export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

    // Close drawer on route change (navigation)
    function handleNavigate() {
        setOpen(false);
    }

    // Close drawer when clicking outside
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (
                drawerRef.current &&
                !drawerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    // Prevent scrolling when drawer is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [open]);

    return (
        <>
            {/* Hamburger for mobile */}
            <div className="md:hidden p-2 border-b bg-white flex items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open sidebar"
                    onClick={() => setOpen(true)}
                >
                    {/* Chevron Left icon for slide-from-left feel */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </Button>
                <span className="ml-2 font-bold text-lg tracking-tight">
                    Admin Panel
                </span>
            </div>
            {/* Mobile drawer */}
            <div
                className={cn(
                    "fixed inset-0 z-50 transition-all duration-300 md:hidden",
                    open
                        ? "visible opacity-100"
                        : "invisible opacity-0 pointer-events-none",
                )}
                aria-hidden={!open}
            >
                {/* Overlay */}
                <div
                    className={cn(
                        "absolute inset-0 bg-black/40 transition-opacity duration-300",
                        open ? "opacity-100" : "opacity-0",
                    )}
                    onClick={() => setOpen(false)}
                />
                {/* Drawer */}
                <div
                    ref={drawerRef}
                    className={cn(
                        "absolute left-0 top-0 h-screen w-4/5 max-w-xs bg-white shadow-xl flex flex-col transition-transform duration-300",
                        open ? "translate-x-0" : "-translate-x-full",
                    )}
                >
                    <div className="h-16 flex items-center px-6 border-b">
                        <span className="font-bold text-lg tracking-tight">
                            Admin Panel
                        </span>
                        <Button
                            variant="ghost"
                            className="ml-auto"
                            size="icon"
                            aria-label="Close menu"
                            onClick={() => setOpen(false)}
                        >
                            <span className="sr-only">Close</span>
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <line
                                    x1="4"
                                    y1="4"
                                    x2="16"
                                    y2="16"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                                <line
                                    x1="16"
                                    y1="4"
                                    x2="4"
                                    y2="16"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                            </svg>
                        </Button>
                    </div>
                    <SidebarNav onNavigate={handleNavigate} />
                    <UserProfile onLogout={handleNavigate} />
                </div>
            </div>
            {/* Sidebar for desktop */}
            <aside className="sticky top-0 h-screen w-full md:w-64 bg-white border-r flex-shrink-0 flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b">
                    <span className="font-bold text-lg tracking-tight">
                        Admin Panel
                    </span>
                </div>
                <SidebarNav />
                <UserProfile />
            </aside>
        </>
    );
}
