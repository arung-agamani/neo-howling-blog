"use client";

import { useAtomValue } from "jotai";
import { IsTransitioningAtom } from "@/components/UserPageV2/JotaiAtoms/LoaderAtom";
import GlobalLoader from "@/components/UserPageV2/GlobalLoader";
import { PropsWithChildren } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {}

const MainContentWrapper: React.FC<PropsWithChildren<Props>> = ({
    children,
}) => {
    const isTransitioning = useAtomValue(IsTransitioningAtom);

    return (
        <>
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg"
                    >
                        <GlobalLoader />
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div
                key="content"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{
                    opacity: isTransitioning ? 0.5 : 1,
                    scale: isTransitioning ? 0.98 : 1,
                }}
                transition={{
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 },
                }}
                style={{ minHeight: "100vh" }}
            >
                {children}
            </motion.div>
        </>
    );
};

export default MainContentWrapper;
