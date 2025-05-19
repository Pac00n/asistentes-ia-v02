import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={`${inter.className} antialiased text-gray-900 bg-white`}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <footer className="bg-gray-50 border-t border-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center">
                  <div className="h-8 w-8 relative">
                    <img 
                      src="/LogosNuevos/logo_orbia_sin_texto.png" 
                      alt="Orbia Logo" 
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="ml-2 text-sm text-gray-500">© {new Date().getFullYear()} Orbia. Todos los derechos reservados.</span>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-6">
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Términos y condiciones</span>
                    <span className="text-sm">Términos</span>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Política de privacidad</span>
                    <span className="text-sm">Privacidad</span>
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
