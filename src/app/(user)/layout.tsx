import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import "./globals.css";
import { Provider } from "./ThemeProvider";
export const metadata = {
    title: "Howling Blog",
    icons: {
        icon: "/favicon.png",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html suppressHydrationWarning>
            <body className="flex flex-col">
                <Provider>
                    <Navbar />
                    {children}
                    <Footer />
                </Provider>
            </body>
        </html>
    );
}
