"use client"
import React, { useState, useEffect } from 'react'
import { Heading, Text, Small, Link, Divider } from '@/components/Typography'
import Image from 'next/image'

const username = "arung-agamani"


// GitHub API User type
interface GitHubUser {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    location: string | null;
    public_repos: number;
    followers: number;
    following: number;
    html_url: string;
}

const GithubCard = () => {
    const [githubData, setGithubData] = useState<[GitHubUser | null, boolean]>([null, false]);

    useEffect(() => {
        (async () => {
            const res = await fetch(`https://api.github.com/users/${username}`);
            if (!res.ok) {
                setGithubData([null, true]);
                return;
            }
            const data = await res.json();
            setGithubData([data, false]);
        })()
    }, [])

    const [data, error] = githubData;

    if (error) {
        return (
            <div className="text-center p-4">
                <Text variant="destructive" className="mb-2">⚠️ Error fetching GitHub data</Text>
                <Small variant="muted">Unable to load profile information</Small>
            </div>
        )
    }
    if (!data) {
        return (
            <div className="text-center p-4">
                <Text className="mb-2">Loading GitHub profile...</Text>
                <div className="animate-pulse">
                    <div className="w-16 h-16 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-3"></div>
                    <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2 mx-auto"></div>
                </div>
            </div>
        )
    }
    return (
        <div className="bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-slate-800/90 dark:to-slate-900/90 
                        rounded-lg p-6 backdrop-blur-sm border border-white/20 dark:border-slate-700/50
                        shadow-lg hover:shadow-xl transition-all duration-300">
            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                    <Image
                        src={data.avatar_url}
                        alt={`${data.login} avatar`}
                        width={64}
                        height={64}
                        className="rounded-full ring-2 ring-blue-500/20 dark:ring-blue-400/30"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                </div>
                <div className="flex-1 min-w-0">
                    <Heading level={5} className="truncate">
                        {data.name || data.login}
                    </Heading>
                    <Small className="text-slate-600 dark:text-slate-400">
                        @{data.login}
                    </Small>
                </div>
            </div>

            {/* Bio */}
            {data.bio && (
                <div className="mb-4">
                    <Text size="sm" className="italic text-slate-700 dark:text-slate-300">
                        &quot;{data.bio}&quot;
                    </Text>
                </div>
            )}

            <Divider className="my-4" />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <Text size="lg" weight="bold" className="block text-blue-600 dark:text-blue-400">
                        {data.public_repos}
                    </Text>
                    <Small>Repositories</Small>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <Text size="lg" weight="bold" className="block text-purple-600 dark:text-purple-400">
                        {data.followers}
                    </Text>
                    <Small>Followers</Small>
                </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 mb-4">
                {data.location && (
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400">📍</span>
                        <Small>{data.location}</Small>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">👥</span>
                    <Small>{data.following} following</Small>
                </div>
            </div>

            {/* GitHub Link */}
            <Link
                href={data.html_url}
                external
                variant="accent"
                className="inline-flex items-center gap-2 w-full justify-center p-2 bg-slate-900 dark:bg-slate-700 
                          text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 
                          transition-colors duration-200 no-underline hover:no-underline"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View Profile
            </Link>
        </div>
    )
}

export default GithubCard