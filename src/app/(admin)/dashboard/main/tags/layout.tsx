import { Suspense } from "react";
import Loading from "./loading";

export const metadata = {
    title: "Tags - Dashboard",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <Suspense fallback={<Loading />}>{children}</Suspense>;
}
