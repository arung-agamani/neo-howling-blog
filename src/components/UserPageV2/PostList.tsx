import { Post } from '@/app/(userv2)/v2/APIContract'
import startCase from 'lodash.startcase'
import Link from 'next/link'
import React from 'react'
import { Heading, Lead, Small, Badge } from '../Typography'

interface Props {
    posts: Post[]
}

const PostList: React.FC<Props> = ({ posts }) => {

    return (
        <>
            {posts.map((post) => (
                <div className='post-container flex flex-col py-4 max-w-sm xs:max-w-3xl lg:max-w-none dark:bg-slate-800/30 bg-white/70 px-4' key={post.id}>
                    <Heading level={4}>
                        <Link href={`/v2/post/${post.id}`} className='hover:underline'>
                            {post.title}
                        </Link>
                    </Heading>
                    <Lead className='text-wrap break-all '>{post.description}</Lead>
                    <Small>Date Posted: {new Date(post.datePosted).toLocaleString('en')}</Small>
                    <div className="tags gap-x-4 flex mt-4 flex-wrap gap-y-2">
                        {
                            Array.from(new Set(post.tags)).map((tag) => (
                                <Badge key={tag}>{startCase(tag)}</Badge>
                            ))}
                    </div>
                    <hr className='mt-4' />
                </div>
            ))}
        </>
    )
}

export default PostList