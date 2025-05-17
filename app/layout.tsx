import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { DashboardNav } from '@/components/DashboardNav'

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
      {/* Modificado: Eliminada la clase bg-white del body */}
      <body className={`${inter.className} text-zinc-800`}>
          <DashboardNav />
          <main className="pt-0 mt-0">
            {children}
          </main>
      </body>
    </html>
  )
}
