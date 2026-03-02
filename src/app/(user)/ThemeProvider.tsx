"use client";
import { ThemeProvider } from "next-themes";
import React, { createContext, useContext, useEffect, useState } from "react";

interface PreferencesContextType {
    contrast: boolean;
    setContrast: (value: boolean) => void;
    showDiary: boolean;
    setShowDiary: (value: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(
    undefined,
);

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (!context) {
        throw new Error(
            "usePreferences must be used within a PreferencesProvider",
        );
    }
    return context;
}

function PreferencesProvider({ children }: { children: React.ReactNode }) {
    const [contrast, setContrast] = useState(true);
    const [showDiary, setShowDiary] = useState(false);

    useEffect(() => {
        const storedContrast = localStorage.getItem("user:contrast");
        if (storedContrast) {
            setContrast(storedContrast === "true");
        }
        const storedShowDiary = localStorage.getItem("user:showDiary");
        if (storedShowDiary) {
            setShowDiary(storedShowDiary === "true");
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            document.documentElement.setAttribute(
                "data-contrast",
                contrast.toString(),
            );
            localStorage.setItem("user:contrast", contrast.toString());
        }
    }, [contrast]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("user:showDiary", showDiary.toString());
        }
    }, [showDiary]);

    return (
        <PreferencesContext.Provider
            value={{ contrast, setContrast, showDiary, setShowDiary }}
        >
            {children}
        </PreferencesContext.Provider>
    );
}

export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" enableSystem={false}>
            <PreferencesProvider>{children}</PreferencesProvider>
        </ThemeProvider>
    );
}
