'use client';

import { FiZap, FiSearch, FiMessageSquare, FiGlobe } from 'react-icons/fi';

const features = [
  {
    name: 'Respuestas Rápidas',
    description: 'Obtén respuestas instantáneas a tus preguntas con nuestra tecnología de IA avanzada.',
    icon: FiZap,
  },
  {
    name: 'Búsqueda Inteligente',
    description: 'Encuentra información relevante en segundos con nuestra potente capacidad de búsqueda.',
    icon: FiSearch,
  },
  {
    name: 'Asistencia Personalizada',
    description: 'Interactúa de forma natural con asistentes especializados en diferentes áreas.',
    icon: FiMessageSquare,
  },
  {
    name: 'Acceso Global',
    description: 'Disponible en cualquier momento y desde cualquier dispositivo con conexión a internet.',
    icon: FiGlobe,
  },
];

export default function FeaturesSection() {
  return (
    <div id="features" className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Características</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Una mejor manera de trabajar con IA
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Descubre cómo nuestra plataforma puede ayudarte a ser más productivo y eficiente.
          </p>
        </div>

        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  {feature.description}
                </dd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
