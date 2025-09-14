"use client"

import { cn } from '@/utils/cn'
import { useTheme } from 'next-themes'
import React, { PropsWithChildren, useEffect, useState } from 'react'

interface Props { }

const LIGHT_THEME_BG = 'https://cdn.howlingmoon.dev/99705945_p0.jpg'
const DARK_THEME_BG = 'https://cdn.howlingmoon.dev/105466007_p0.png'

const TopDivWrapper: React.FC<PropsWithChildren<Props>> = ({ children }) => {
    const theme = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null;
    return (
        <div
            className={cn("bg-blue-950 min-h-screen bg-cover bg-center bg-fixed",
                "transition-all duration-500"
            )}
            style={{
                backgroundImage: `url('${theme.theme === 'dark' ? DARK_THEME_BG : LIGHT_THEME_BG}')`
            }}
        >
            {children}
        </div>
    )
}

export default TopDivWrapper