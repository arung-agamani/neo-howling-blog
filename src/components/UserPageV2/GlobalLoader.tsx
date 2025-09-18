"use client"
import { Lead } from "../Typography";

export default function GlobalLoader() {
    return (
        <div>
            <Lead className='text-white text-center mb-4'>Loading...</Lead>
            <img src="https://cdn.howlingmoon.dev/sirkel.id/kururin-kuru-kuru.gif" height={200} alt="Loading..." className='mx-auto' />
        </div>
    )
}