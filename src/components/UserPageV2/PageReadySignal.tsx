"use client"
import { useAtom, useSetAtom } from "jotai"
import { useEffect, PropsWithChildren } from "react"
import { IsReadyAtom, IsTransitioningAtom } from "./JotaiAtoms/LoaderAtom"
import { motion, AnimatePresence } from "framer-motion"

interface Props { }

const PageReadySignal: React.FC<PropsWithChildren<Props>> = ({ children }) => {
    const setIsTransitioning = useSetAtom(IsTransitioningAtom)
    const [isReady, setIsReady] = useAtom(IsReadyAtom)

    useEffect(() => {
        setIsTransitioning(false)
        setIsReady(true)
    }, [setIsTransitioning, setIsReady])

    if (!isReady) return null

    return <AnimatePresence>
        {isReady && (
            <motion.div
                key="page"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
            >
                {children}
            </motion.div>
        )}
    </AnimatePresence>
}

export default PageReadySignal