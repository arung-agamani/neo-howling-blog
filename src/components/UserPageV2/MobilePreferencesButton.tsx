"use client";

import React from "react";
import { Settings } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import DarkModeToggler from "./DarkModeToggler";

const MobilePreferencesButton = () => {
    return (
        <div className="fixed bottom-6 right-6 z-50 lg:hidden">
            <Dialog>
                <DialogTrigger asChild>
                    <button
                        className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-900 dark:bg-slate-700 text-white shadow-lg hover:bg-orange-800 dark:hover:bg-slate-600 active:scale-95 transition-transform"
                        aria-label="Open preferences"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                </DialogTrigger>
                <DialogContent className="w-[90vw] max-w-sm rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Preferences</DialogTitle>
                    </DialogHeader>
                    <DarkModeToggler />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MobilePreferencesButton;
