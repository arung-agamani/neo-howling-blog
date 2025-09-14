"use client"

import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react'
import { Text } from '../Typography';
import { Switch } from '../ui/switch'

const DarkModeToggler = () => {
    const theme = useTheme();
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])
    if (!mounted) return null;
    return (
        <div className='flex items-center my-4 gap-x-2'>
            <Switch checked={theme.theme !== "light"} onCheckedChange={(checked) => {
                console.log(checked)
                if (!checked) {
                    theme.setTheme("light")
                } else {
                    theme.setTheme("dark")
                }
            }} /><Text>Dark Mode?</Text>
        </div>
    )
}

export default DarkModeToggler