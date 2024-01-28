import QueryProviders from "@/hooks/providers";

export const metadata = {
    title: "Assets Browser - Dashboard",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <QueryProviders>{children}</QueryProviders>;
}
