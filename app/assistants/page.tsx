"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ArrowRight, Cpu, MessageCircle } from "lucide-react";
import Image from "next/image";
import SmallRotatingLogo from "../components/SmallRotatingLogo";

interface Assistant {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const assistants: Assistant[] = [
  {
    id: "openai",
    title: "Asistente de OpenAI",
    description: "Chat avanzado con inteligencia artificial de OpenAI para respuestas precisas y detalladas.",
    icon: <MessageCircle className="w-8 h-8 text-blue-400" />,
    href: "/chat/openai",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "mcp",
    title: "Asistente MCP",
    description: "Asistente personalizado con capacidades avanzadas de procesamiento y herramientas especializadas.",
    icon: <Cpu className="w-8 h-8 text-purple-400" />,
    href: "/chat/mcp",
    color: "from-purple-500 to-purple-600"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

export default function AssistantsPage() {
  const [rotation, setRotation] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      setRotation(scrollY * 0.3);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredAssistants = assistants.filter(assistant => 
    assistant.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assistant.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Fondo con efecto de partículas y gradiente */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-transparent"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-black/90"></div>
        
        {/* Logo giratorio en el fondo */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              <div 
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3b82f640_0,transparent_60%)] rounded-full"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.1s ease-out',
                  filter: 'blur(80px)'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <SmallRotatingLogo />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-300 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
            </span>
            Asistentes disponibles
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
            Elige tu asistente de IA
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Selecciona entre nuestros asistentes especializados para obtener la mejor asistencia en tus tareas diarias.
          </p>
          
          <div className="mt-8 max-w-2xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar asistentes..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredAssistants.map((assistant, index) => (
            <motion.div 
              key={assistant.id}
              variants={itemVariants}
              className="group"
            >
              <Link href={assistant.href} className="block h-full">
                <div className={`h-full bg-gradient-to-br ${assistant.color}/10 to-transparent border border-gray-800/50 rounded-2xl p-6 hover:border-blue-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 backdrop-blur-sm group-hover:-translate-y-1`}>
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${assistant.color}/20`}>
                      {assistant.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-1">{assistant.title}</h3>
                      <p className="text-gray-300 text-sm">{assistant.description}</p>
                    </div>
                    <div className="flex-shrink-0 text-gray-400 group-hover:text-white transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="mt-24 text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6">¿Necesitas ayuda para elegir?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Nuestros asistentes están diseñados para cubrir diferentes necesidades. 
            Si no estás seguro de cuál elegir, comienza con el Asistente de OpenAI para una experiencia general, 
            o elige el Asistente MCP para funcionalidades más avanzadas y personalizadas.
          </p>
          <div className="inline-flex items-center space-x-2 text-blue-400">
            <span>¿Aún tienes dudas?</span>
            <a href="#" className="hover:underline hover:text-blue-300 transition-colors">Contáctanos</a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
