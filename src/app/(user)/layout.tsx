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
            <body className="">
                {/* <Header /> */}
                <Provider>
                    <Navbar />
                    {children}
                    <footer>
                        <Footer />
                    </footer>
                </Provider>
            </body>
        </html>
    );
}
