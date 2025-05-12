import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from "next-themes"
import ClientThemeToggleWrapper from "./components/ClientThemeToggleWrapper"
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Orbia - Asistentes de IA',
  description: 'Plataforma de asistentes inteligentes de Orbia',
  generator: 'v0.dev',
}



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} text-zinc-800 bg-white`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="fixed top-4 right-4 z-50">
            <ClientThemeToggleWrapper />
          </div>
          <main className="pt-0 mt-0">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
