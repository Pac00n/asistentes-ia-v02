'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, Search } from 'lucide-react';
import { AssistantCard } from "@/components/AssistantCard";
import SmallRotatingLogo from "./components/SmallRotatingLogo";

const features = [
  {
    name: 'Respuestas Rápidas',
    description: 'Obtén respuestas instantáneas a tus preguntas con nuestra tecnología de IA avanzada.',
    icon: 'zap',
  },
  {
    name: 'Búsqueda Inteligente',
    description: 'Encuentra información relevante en segundos con nuestra potente capacidad de búsqueda.',
    icon: 'search',
  },
  {
    name: 'Asistencia Personalizada',
    description: 'Interactúa de forma natural con asistentes especializados en diferentes áreas.',
    icon: 'message-circle',
  },
  {
    name: 'Acceso Global',
    description: 'Disponible en cualquier momento y desde cualquier dispositivo con conexión a internet.',
    icon: 'globe',
  },
];

export default function Home() {
  const [rotation, setRotation] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      setRotation(scrollY * 0.3);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white relative overflow-x-hidden">
      {/* Fondo con efecto de rotación */}
      <div 
        className="fixed inset-0 flex justify-center items-center z-0 pointer-events-none"
        style={{ filter: 'blur(18px)', opacity: 0.15 }}
      >
        <motion.div 
          className="w-full h-full flex items-center justify-center"
          style={{ rotate: rotation }}
        >
          <Image
            src="/LogosNuevos/logo_orbia_sin_texto.png"
            alt="Orbia Logo"
            width={600}
            height={600}
            className="object-contain opacity-30"
          />
        </motion.div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <SmallRotatingLogo />
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="block">Potencia tu</span>
              <span className="text-blue-400">productividad</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-300 max-w-3xl mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Descubre cómo nuestros asistentes de IA pueden transformar tu flujo de trabajo, 
              automatizar tareas y ofrecerte información valiosa en tiempo real.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Link 
                href="/chat"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Comenzar ahora
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="#asistentes"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
              >
                Explorar asistentes
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Características principales</h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Todo lo que necesitas para potenciar tu productividad con IA
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={cardVariants}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-blue-400 text-xl">
                      {feature.icon === 'zap' && '⚡'}
                      {feature.icon === 'search' && '🔍'}
                      {feature.icon === 'message-circle' && '💬'}
                      {feature.icon === 'globe' && '🌐'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Asistentes Section */}
        <section id="asistentes" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestros Asistentes</h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Selecciona el asistente que mejor se adapte a tus necesidades
              </p>
              
              <div className="mt-8 max-w-md mx-auto">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar asistentes..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-black/30 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                custom={0}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                className="h-full"
              >
                <AssistantCard 
                  title="Asistente OpenAI" 
                  description="Asistente basado en GPT-4 con capacidades avanzadas de procesamiento de lenguaje natural." 
                  route="/chat/openai"
                  badge="Nuevo"
                  badgeColor="bg-blue-100 text-blue-800"
                  icon="message-circle"
                  className="h-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/30 transition-colors"
                />
              </motion.div>
              
              <motion.div
                custom={1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                className="h-full"
              >
                <AssistantCard 
                  title="Asistente MCP" 
                  description="Potenciado con herramientas externas para búsqueda web, clima, calculadora, divisas y noticias." 
                  route="/chat/mcp"
                  badge="MCP"
                  badgeColor="bg-emerald-100 text-emerald-800"
                  icon="cpu"
                  className="h-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/30 transition-colors"
                />
              </motion.div>
              
              <motion.div
                custom={2}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                className="h-full"
              >
                <div className="h-full bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-colors flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-500/20 text-purple-400">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="ml-4 text-xl font-semibold">¿Tienes alguna solicitud especial?</h3>
                  </div>
                  <p className="text-gray-400 flex-grow">
                    Estamos constantemente desarrollando nuevos asistentes. ¡Déjanos saber qué tipo de asistente te gustaría ver en el futuro!
                  </p>
                  <div className="mt-6">
                    <Link
                      href="#"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                    >
                      Enviar sugerencia
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="block">¿Listo para comenzar?</span>
              <span className="text-blue-200">Explora el poder de la IA hoy mismo.</span>
            </motion.h2>
            
            <motion.p 
              className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Únete a miles de usuarios que ya están transformando su productividad con nuestros asistentes de IA.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Link
                href="/chat"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                Empezar gratis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Potenciando el futuro con <span className="text-blue-400">IA</span>
                </h2>
                <div className="h-1 w-20 bg-blue-500 rounded-full mb-8"></div>
                
                <div className="space-y-6">
                  <p className="text-lg text-gray-300">
                    En Orbia, estamos comprometidos con el desarrollo de soluciones de inteligencia artificial que ayuden a las personas y empresas a alcanzar su máximo potencial. Nuestra plataforma de asistentes de IA está diseñada para ser intuitiva, poderosa y accesible para todos.
                  </p>
                  <p className="text-lg text-gray-300">
                    Nuestro equipo de expertos en IA trabaja incansablemente para ofrecerte las herramientas más avanzadas y fáciles de usar, permitiéndote enfocarte en lo que realmente importa.
                  </p>
                  
                  <div className="pt-4">
                    <Link 
                      href="#"
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Conoce más sobre nosotros
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                className="relative h-96 w-full rounded-2xl overflow-hidden"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl backdrop-blur-sm"></div>
                <Image
                  src="/LogosNuevos/orbia_text_transparent.png"
                  alt="Orbia IA"
                  fill
                  className="object-contain p-12"
                />
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
