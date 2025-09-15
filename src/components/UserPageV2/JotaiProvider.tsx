"use client";

import { Provider as JProvider } from "jotai"
import { PropsWithChildren } from "react";

interface Props { }

export const JotaiProvider: React.FC<PropsWithChildren<Props>> = ({ children }) => {
    return (
        <JProvider>
            {children}
        </JProvider>
    )
}

export default JotaiProvider;