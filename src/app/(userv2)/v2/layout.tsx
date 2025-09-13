import React, { PropsWithChildren } from 'react'

import './globals.css'
import { Provider } from './ThemeProvider'

interface Props { }

const V2Layout: React.FC<PropsWithChildren<Props>> = ({ children }) => {
    return (
        <html>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin='anonymous' />
                <link href="https://fonts.googleapis.com/css2?family=Klee+One&display=swap" rel="stylesheet" />
            </head>
            <body>
                <Provider>
                    {children}
                </Provider>
            </body>
        </html>
    )
}

export default V2Layout