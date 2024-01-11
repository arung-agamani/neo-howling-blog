import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import { Provider } from "./ThemeProvider";
import "./globals.css";
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
            <body /* className="bg-gray-700" */>
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
