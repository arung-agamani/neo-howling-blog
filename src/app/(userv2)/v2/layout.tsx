import { Blockquote, Heading, Lead, Link } from '@/components/Typography'
import DarkModeToggler from '@/components/UserPageV2/DarkModeToggler'
import GithubCard from '@/components/UserPageV2/GithubCard'
import TopDivWrapper from '@/components/UserPageV2/TopDivWrapper'
import React, { PropsWithChildren } from 'react'

import './globals.css'
import { Provider } from './ThemeProvider'

interface Props { }

const V2Layout: React.FC<PropsWithChildren<Props>> = ({ children }) => {
    return (<html>
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin='anonymous' />
            <link href="https://fonts.googleapis.com/css2?family=Klee+One&display=swap" rel="stylesheet" />
        </head>
        <body>
            <Provider>
                <TopDivWrapper>
                    <div className='bg-orange-950/50 min-h-screen'>
                        <div id="header" className="mx-auto container pt-4" >
                            <Heading className='text-white'>Howling Blog V3</Heading>
                            <Lead className='mt-2 text-white mb-8'>It&apos;s the third time I&apos;m changing the view, man</Lead>

                        </div>
                        <div className="flex container mx-auto gap-x-2">
                            <div className="flex flex-col xl:flex-grow">
                                {children}
                            </div>
                            <div className="hidden xl:block min-w-[512px] max-w-lg bg-white/70 dark:bg-slate-800/30 p-4">
                                <div className='sticky top-[15%]'>
                                    <Heading level={6} className='mt-2 border-b-2 border-slate-800 dark:border-white'>Which Team Are You?</Heading>
                                    <DarkModeToggler />
                                    <Heading level={6} className='mt-2 border-b-0 border-slate-800 dark:border-white'>Github</Heading>
                                    <GithubCard />
                                    <Heading level={6} className='mt-2 border-b-2 border-slate-800 dark:border-white'>Did You Know?</Heading>
                                    <Blockquote className='mt-2'>This blog is made with Next.js, TailwindCSS, Prisma, and currently hosted in Vercel. The source code is available on <Link href="https://github.com/arung-agamani/neo-howling-blog" external>GitHub</Link>.</Blockquote>
                                </div>
                            </div>
                        </div>
                    </div>
                </TopDivWrapper>
            </Provider>
        </body>
    </html>
    )
}

export default V2Layout