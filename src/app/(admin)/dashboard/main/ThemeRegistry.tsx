import { ThemeProvider, createTheme } from "@mui/material/styles";
import { PropsWithChildren } from "react"

import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter"

const theme = createTheme({
    palette: {
        primary: {
            main: "#947EB0",
        },
        secondary: {
            main: "#766C7F",
        },
        text: {
            primary: "#0B132B",
            secondary: "#38023B",
        },
    },
});

type ThemeRegistryProps = {
    options?: {
        key: string;
    };
}

export default function ThemeRegistry(props: PropsWithChildren<ThemeRegistryProps>) {
    const { children } = props;
    return (
        <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </AppRouterCacheProvider>
    )
}