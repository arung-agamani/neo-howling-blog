"use client";

import { usePreferences } from "@/app/(userv2)/v2/ThemeProvider";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { Text } from "../Typography";
import { Switch } from "../ui/switch";

const DarkModeToggler = () => {
    const theme = useTheme();
    const [mounted, setMounted] = useState(false);
    const { contrast, setContrast, showDiary, setShowDiary } = usePreferences();
    useEffect(() => {
        (async () => {
            setMounted(true);
        })();
    }, []);
    if (!mounted) return null;
    return (
        <>
            <div className="flex items-center my-4 gap-x-2">
                <Switch
                    checked={theme.theme !== "light"}
                    onCheckedChange={(checked) => {
                        if (!checked) {
                            theme.setTheme("light");
                        } else {
                            theme.setTheme("dark");
                        }
                    }}
                />
                <Text>Dark Mode?</Text>
            </div>
            <div className="flex items-center my-4 gap-x-2">
                <Switch
                    checked={contrast}
                    onCheckedChange={(checked) => {
                        if (!checked) {
                            setContrast(false);
                        } else {
                            setContrast(true);
                        }
                    }}
                />
                <Text>Decrease Transparency</Text>
            </div>
            <div className="flex items-center my-4 gap-x-2">
                <Switch
                    checked={showDiary}
                    onCheckedChange={(checked) => {
                        if (!checked) {
                            setShowDiary(false);
                        } else {
                            setShowDiary(true);
                        }
                    }}
                />
                <Text>Show Diary Entries</Text>
            </div>
        </>
    );
};

export default DarkModeToggler;
