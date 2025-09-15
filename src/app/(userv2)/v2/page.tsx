"use client"

import { Lead } from '@/components/Typography'
import React, { useState, useEffect } from 'react'
import { ApiV1Response, Post } from './APIContract'
import PostList from '@/components/UserPageV2/PostList'
import { useAtom } from 'jotai'
import { APIResultPostsAtom } from '@/components/UserPageV2/JotaiAtoms/PostAtom'

// TODO: turn this into server component since the dependency to hooks aint there anyway

const Page = () => {
    const [apiRes, setApiRes] = useAtom(APIResultPostsAtom)
    useEffect(() => {
        (async () => {
            // simulate error
            // setApiRes([[], true])
            // return
            if (apiRes[0].length > 0 || apiRes[1]) {
                return;
            }
            const res = await fetch('/api/v1/posts')
            const data = await res.json() as ApiV1Response<Post[]>
            if (data.success) {
                setApiRes([data.data, false])
            } else {
                setApiRes([[], true])
            }
        })()
    }, [])

    const [posts, apiError] = apiRes

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