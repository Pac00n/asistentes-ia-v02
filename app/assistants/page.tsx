"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Search } from "lucide-react";
import { assistants } from "@/lib/assistants";
import { IconRenderer } from "@/components/ui/icon-renderer";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import SmallRotatingLogo from "../components/SmallRotatingLogo";
import { motion, AnimatePresence } from "framer-motion"; // Asegurar que motion y AnimatePresence estén importados

export default function AssistantsPage() {
  const [rotation, setRotation] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      setRotation(scrollY * 0.3); // Reducir un poco la velocidad de rotación del fondo
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredAssistants = assistants.filter(assistant => 
    assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assistant.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i:number) => ({
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
      <div
        className="fixed inset-0 flex justify-center items-center z-0 pointer-events-none"
        style={{ filter: 'blur(18px)', opacity: 0.15 }} // Aumentar un poco el blur y bajar opacidad
      >
        <motion.div 
          className="relative" 
          style={{ width: '600px', height: '600px' }}
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        >
          <Image
            src="/LogosNuevos/logo_orbia_sin_texto.png"
            alt="Logo Orbia Sin Texto Background"
            fill
            priority
            className="object-contain"
          />
        </motion.div>
      </div>

      <div className="relative z-10">
        <section className="w-full flex flex-col items-center pt-12 pb-8 sm:pt-16 sm:pb-10">
          <div className="mb-6">
            <SmallRotatingLogo />
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut"}}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 sm:mb-4 tracking-tight text-center bg-gradient-to-br from-white via-neutral-200 to-blue-300 bg-clip-text text-transparent drop-shadow-xl"
          >
            Nuestros Asistentes
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut"}}
            className="text-base sm:text-lg md:text-xl text-neutral-300 max-w-xl md:max-w-2xl mx-auto mb-6 text-center font-medium drop-shadow-md px-4"
          >
            Explora nuestra colección de asistentes especializados, listos para potenciar tu flujo de trabajo.
          </motion.p>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut"}}
            className="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-12"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Explora Asistentes</h2>
              <p className="text-neutral-400 text-sm sm:text-base">Encuentra la IA perfecta para tu tarea.</p>
            </div>
            <div className="mt-4 md:mt-0 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o función..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-neutral-800/70 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-72 text-sm sm:text-base shadow-sm"
                />
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredAssistants.length > 0 ? (
                filteredAssistants.map((assistant, i) => (
                  <motion.div
                    key={assistant.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }} // Animación de salida
                  >
                    <Card
                      className="bg-neutral-900/60 rounded-xl border border-neutral-800/70 shadow-lg hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-md overflow-hidden h-full flex flex-col group hover:border-blue-500/50"
                    >
                      <CardHeader className="p-5 sm:p-6 pb-3 sm:pb-4 text-center">
                        <div className="flex justify-center mb-4">
                          <div className={`relative w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-700 group-hover:from-blue-600 group-hover:to-sky-500 transition-all duration-300 shadow-md group-hover:shadow-lg group-hover:shadow-blue-500/30`}>
                            <IconRenderer iconType={assistant.iconType} className="h-7 w-7 text-blue-400 group-hover:text-white transition-colors duration-300" size={28} />
                            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 border-2 border-blue-400/50 transition-opacity duration-300"></div>
                          </div>
                        </div>
                        <CardTitle className="text-lg sm:text-xl font-semibold mb-1 text-neutral-100 group-hover:text-white transition-colors duration-300">{assistant.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors duration-300 h-10 line-clamp-2">
                          {assistant.shortDescription}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-5 sm:p-6 pt-0 flex-grow">
                        {/* Se podría añadir más contenido si se desea, como tags o una descripción más larga aquí si no hay shortDescription */}
                      </CardContent>
                      <CardFooter className="p-4 sm:p-5 border-t border-neutral-800/70 group-hover:border-blue-500/30 transition-colors duration-300 mt-auto">
                        <Button asChild className="w-full bg-neutral-800 hover:bg-blue-600 text-neutral-300 hover:text-white rounded-md transition-all duration-300 shadow group-hover:shadow-md group-hover:shadow-blue-600/30 py-2.5">
                          <Link href={`/chat/${assistant.id}`} className="flex items-center justify-center">
                            <span>Chatear ahora</span>
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-10">
                  <p className="text-neutral-400">No se encontraron asistentes con ese término de búsqueda.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Footer sutil */}
        <footer className="text-center py-10 mt-12">
            <p className="text-sm text-neutral-600">© {new Date().getFullYear()} Orbia Asistentes. Potenciando el futuro.</p>
        </footer>

      </div>
    </div>
  );
}
