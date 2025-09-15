"use client";
import React, { useEffect, useState } from 'react'
import { Blockquote, Lead } from '../Typography';

interface Joke {
    type: "textual" | "image";
    content: string;
}

const BapakBapak = () => {
    const [randomJoke, setRandomJoke] = useState<Joke | null>(null)
    const fetchJoke = async () => {
        const res = await fetch('/api/v1/bapak-bapak')
        const data = await res.json() as { success: boolean, data: Joke, errors: string[] }
        if (data.success) {
            setRandomJoke(data.data)
        }
    }
    const refreshJoke = async () => {
        await fetchJoke()
    }

    useEffect(() => {
        fetchJoke()
    }, [])

    if (!randomJoke) {
        return <Lead>Fetching recehan tongkrongan jam 8 malam</Lead>
    }

    return (<div className="text-center">
        {randomJoke.type === "textual" ? <Blockquote>{randomJoke.content}</Blockquote> : <img src={randomJoke.content} alt="Bapak-Bapak Meme" className='w-full h-auto' />}
        <button onClick={() => { refreshJoke() }} className='px-2 pb-2 border-0 dark:border border-s-slate-950 bg-slate-300 hover:bg-slate-200 dark:bg-slate-700 rounded-lg mt-2 mx-auto hover:dark:bg-slate-600 hover:cursor-pointer'>😂😂Acumalaka😂😂</button>
    </div>)
}

export default BapakBapak