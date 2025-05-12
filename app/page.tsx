import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Brain, Clock, Sparkles, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Sparkles size={16} className="mr-2" />
                <span>Potencia tu productividad con IA</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900">
                Asistentes inteligentes para tu día a día
              </h1>
              <p className="text-xl text-gray-600">
                Accede a asistentes especializados que te ayudarán a ser más productivo, creativo y eficiente en tus
                tareas diarias.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/assistants">
                    Ver asistentes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/chat/default">Probar ahora</Link>
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <div className="relative">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-400 opacity-30 blur"></div>
                <div className="relative bg-white rounded-lg shadow-xl overflow-hidden">
                  <img
                    src="/placeholder.svg?height=400&width=500"
                    alt="Asistente IA en acción"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Características principales</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Nuestros asistentes están diseñados para ayudarte en diferentes áreas de tu vida profesional y personal.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Asistentes especializados</h3>
              <p className="text-gray-600">
                Cada asistente está entrenado para un área específica, desde marketing hasta programación.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ahorra tiempo</h3>
              <p className="text-gray-600">
                Automatiza tareas repetitivas y obtén respuestas rápidas a tus preguntas más frecuentes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Potencia tu creatividad</h3>
              <p className="text-gray-600">
                Genera ideas, contenido y soluciones creativas con la ayuda de nuestros asistentes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Lo que dicen nuestros usuarios</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                    <span className="text-emerald-600 font-medium">{String.fromCharCode(64 + i)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Usuario {i}</h4>
                    <p className="text-sm text-gray-500">Profesional</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "Los asistentes me han ayudado a mejorar mi productividad en un 30%. Ahora puedo concentrarme en lo
                  que realmente importa."
                </p>
                <div className="mt-4 flex">
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
      <section className="py-20 px-4 bg-emerald-600 text-white">
        <div className="container mx-auto max-w-6xl text-center">
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
        <div className="container mx-auto max-w-6xl">
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
            <p>&copy; {new Date().getFullYear()} AI Assistants. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
