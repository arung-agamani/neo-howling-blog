"use client"

import { Badge, Blockquote, Heading, Lead, Link, Small, Text } from '@/components/Typography'
import { useTheme } from 'next-themes'
import React, { useState, useEffect } from 'react'
import { ApiV1Response, Post } from './APIContract'
import PostList from '@/components/UserPageV2/PostList'
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

    if (!isClient) {
        return null
    }
    return (
        <>
            {posts.length === 0 && !apiError && <div>
                <Lead className='text-white text-center mb-4'>Loading...</Lead>
                <img src="https://cdn.howlingmoon.dev/sirkel.id/kururin-kuru-kuru.gif" height={200} alt="Loading..." className='mx-auto' />
            </div>}
            {apiError && <div>
                <Lead className='text-white text-center mb-4'>Error when fetching.</Lead>
                <img src="https://cdn.howlingmoon.dev/sirkel.id/89325870.gif" height={200} alt="Loading..." className='mx-auto' />
            </div>}
            <PostList posts={posts.filter(x => x.isPublished)} />
        </>
    )
}

export default Page