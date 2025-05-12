import type { Metadata } from 'next'
import Link from "next/link"
import Image from "next/image"
import './globals.css'
import { ThemeProvider } from "next-themes"
import ClientThemeToggleWrapper from "./components/ClientThemeToggleWrapper"

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
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-background/80 backdrop-blur-md border-b border-border/50">
            <Link href="/" className="inline-block">
              <Image src="/LogosNuevos/logo.svg" alt="Orbia Logo" width={150} height={40} priority />
            </Link>
            <ClientThemeToggleWrapper />
          </header>
          {/* Add padding to main content to avoid overlap with fixed header */}
          <main className="pt-20">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
