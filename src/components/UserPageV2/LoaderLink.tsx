'use client';
import { useSetAtom } from 'jotai';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IsReadyAtom, IsTransitioningAtom } from './JotaiAtoms/LoaderAtom';

interface LoaderLinkProps extends React.ComponentProps<typeof Link> {
    href: string;
    children: React.ReactNode;
}

export default function LoaderLink({ href, children, ...props }: LoaderLinkProps) {
    const router = useRouter();
    const setIsTransitioning = useSetAtom(IsTransitioningAtom)
    const setIsReady = useSetAtom(IsReadyAtom)

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        // Only intercept left-click without modifier keys
        if (
            !e.defaultPrevented &&
            e.button === 0 &&
            !e.metaKey &&
            !e.ctrlKey &&
            !e.shiftKey &&
            !e.altKey
        ) {
            e.preventDefault();
            setIsTransitioning(true);
            setIsReady(false);
            router.push(href);
        }
    };

    return (
        <Link href={href} {...props} onClick={handleClick}>
            {children}
        </Link>
    );
}