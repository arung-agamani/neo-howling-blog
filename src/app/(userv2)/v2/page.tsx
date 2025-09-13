"use client"

import { Badge, Blockquote, Heading, Lead, Link, Small } from '@/components/Typography'
import startCase from 'lodash.startcase'
import { useTheme } from 'next-themes'
import React, { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'
import { ApiV1Response, Post } from './APIContract'

const LIGHT_THEME_BG = 'https://cdn.howlingmoon.dev/99705945_p0.jpg'
const DARK_THEME_BG = 'https://cdn.howlingmoon.dev/105466007_p0.png'

const Page = () => {
    const theme = useTheme()
    const [isClient, setIsClient] = useState(false)
    const [apiRes, setApiRes] = useState<[Post[], boolean]>([[], false])

    useEffect(() => {
        (async () => {
            // simulate error
            // setApiRes([[], true])
            // return

            const res = await fetch('/api/v1/posts')
            const data = await res.json() as ApiV1Response<Post[]>
            if (data.success) {
                setApiRes([data.data, false])
            } else {
                setApiRes([[], true])
            }
        })()

        setIsClient(true)
    }, [])

    const [posts, apiError] = apiRes
    return (
        <div
            className={cn("bg-blue-950 min-h-screen bg-cover bg-center bg-fixed",
                "transition-all duration-500"
            )}
            style={{
                backgroundImage: `url('${theme.theme === 'dark' ? DARK_THEME_BG : LIGHT_THEME_BG}')`
            }}
        >
            <div className='bg-orange-950/50 min-h-screen'>
                <div className="flex flex-col px-4 py-8">
                    <Heading className='text-white'>Howling Blog V3</Heading>
                    <Lead className='mt-2 text-white mb-8'>It's the third time I'm changing the view, man</Lead>
                    {posts.length === 0 && !apiError && <div>
                        <Lead className='text-white text-center mb-4'>Loading...</Lead>
                        <img src="https://cdn.howlingmoon.dev/sirkel.id/kururin-kuru-kuru.gif" height={200} alt="Loading..." className='mx-auto' />
                    </div>}
                    {apiError && <div>
                        <Lead className='text-white text-center mb-4'>Error when fetching.</Lead>
                        <img src="https://cdn.howlingmoon.dev/sirkel.id/89325870.gif" height={200} alt="Loading..." className='mx-auto' />
                    </div>}
                    {posts.filter(post => post.isPublished).map((post, i) => (
                        <div className='post-container py-4 dark:bg-slate-800/30 bg-white/70 px-4' key={i}>
                            <Heading level={4}>{post.title}</Heading>
                            <Lead>{post.description}</Lead>
                            {isClient && <Small>Date Posted: {new Date(post.datePosted).toLocaleString('en')}</Small>}
                            <div className="tags gap-x-4 flex mt-4">
                                {
                                    post.tags.map((tag) => (
                                        <Badge key={tag}>{startCase(tag)}</Badge>
                                    ))}
                            </div>
                            <hr className='mt-4 opacity-20' />
                        </div>
                    ))}
                </div>

            </div>
        </div >
    )
}

export default Page