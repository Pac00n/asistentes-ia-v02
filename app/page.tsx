"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Brain, Clock, Sparkles, Zap } from "lucide-react"
import RotatingLogoStacked from "./components/RotatingLogoStacked"
import { useEffect, useState } from "react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      {/* Hero Section */}
      <section className="w-full flex flex-col items-center pt-4 pb-10 mt-0">
        <RotatingLogoStacked />
        
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight text-center bg-gradient-to-br from-white via-blue-100 to-blue-300 bg-clip-text text-transparent drop-shadow-xl">Bienvenido a Orbia</h1>
        
        <p className="text-lg md:text-2xl text-white max-w-2xl mx-auto mb-6 text-center font-medium drop-shadow-md">La plataforma de IA premium donde la productividad y la creatividad se encuentran.</p>
        
        <div className="flex justify-center mt-6">
          {/* Modificado: Se eliminaron los divs decorativos internos del Link */}
          <Button asChild className="mt-4 px-8 py-3 text-lg font-bold rounded-full relative group bg-white">
            <Link href="/assistants" className="relative z-10 flex items-center">
              <span className="text-black font-bold">Ver asistentes</span>
              <ArrowRight className="ml-2 h-5 w-5 text-black" />
              {/* Los divs para el efecto hover han sido eliminados para la prueba */}
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Características principales</h2>
            <p className="mt-4 text-xl text-gray-300 max-w-2xl mx-auto">
              Nuestros asistentes están diseñados para ayudarte en diferentes áreas de tu vida profesional y personal.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-neutral-900/80 p-6 rounded-xl border border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Asistentes especializados</h3>
              <p className="text-gray-300">
                Cada asistente está entrenado para un área específica, desde marketing hasta programación.
              </p>
            </div>

            <div className="bg-neutral-900/80 p-6 rounded-xl border border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Ahorra tiempo</h3>
              <p className="text-gray-300">
                Automatiza tareas repetitivas y obtén respuestas rápidas a tus preguntas más frecuentes.
              </p>
            </div>

            <div className="bg-neutral-900/80 p-6 rounded-xl border border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Potencia tu creatividad</h3>
              <p className="text-gray-300">
                Genera ideas, contenido y soluciones creativas con la ayuda de nuestros asistentes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Lo que dicen nuestros usuarios</h2>
            <p className="mt-4 text-xl text-gray-300 max-w-2xl mx-auto">
              Nuestros usuarios comparten sus experiencias utilizando nuestros asistentes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-neutral-900/80 p-6 rounded-xl border border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-blue-600 font-bold text-lg">{String.fromCharCode(64 + i)}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Usuario {i}</h3>
                <p className="text-gray-300 mb-4">
                  "Los asistentes me han ayudado a mejorar mi productividad en un 30%. Ahora puedo concentrarme en lo
                  que realmente importa."
                </p>
                <div className="flex">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-transparent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center">
          <h2 className="text-3xl font-bold mb-6">Comienza a potenciar tu productividad hoy</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-emerald-50">
            Únete a miles de profesionales que ya están aprovechando el poder de la IA para ser más productivos.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/assistants">
              Explorar asistentes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="text-xl font-bold text-white mb-4">AI Assistants</h3>
              <p className="max-w-xs">Potenciando tu productividad con asistentes de inteligencia artificial.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-white font-medium mb-4">Producto</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/assistants" className="hover:text-white">
                      Asistentes
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      Precios
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-4">Compañía</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="hover:text-white">
                      Sobre nosotros
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      Contacto
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="hover:text-white">
                      Privacidad
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      Términos
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} Orbia. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
