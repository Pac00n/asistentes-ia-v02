"use client";

import Link from "next/link"; // Link sigue siendo necesario si SmallRotatingLogo no lo exporta directamente
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; 
import { ArrowRight, Search } from "lucide-react";
import { assistants } from "@/lib/assistants";
import { IconRenderer } from "@/components/ui/icon-renderer";
import React, { useState, useEffect } from "react"; 
import Image from "next/image"; // Image sigue siendo necesario para el fondo
import SmallRotatingLogo from "../components/SmallRotatingLogo"; // Importamos el nuevo componente

export default function AssistantsPage() {
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      setRotation(scrollY * 0.4);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white relative">
      {/* Fondo: logo girando, fijo y centrado */}
      <div
        className="fixed inset-0 flex justify-center items-center z-0 pointer-events-none"
        style={{ filter: 'blur(12px)', opacity: 0.20 }}
      >
        <div className="relative" style={{ width: '620px', height: '620px' }}>
          <Image
            src="/LogosNuevos/logo_orbia_sin_texto.png"
            alt="Logo Orbia Sin Texto Background"
            fill
            priority
            className="object-contain"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.1s linear',
            }}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10">
        <section className="w-full flex flex-col items-center pt-16 pb-10 mt-0"> 
          
          {/* Logo Orbia pequeño, rotatorio y enlazado a la página de inicio */}
          <div className="mb-4"> {/* Añadimos margen inferior aquí */}
            <SmallRotatingLogo />
          </div>
          {/* Fin del Logo Orbia */}

          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight text-center bg-gradient-to-br from-white via-blue-100 to-blue-300 bg-clip-text text-transparent drop-shadow-xl">
            Nuestros Asistentes
          </h1>
          <p className="text-lg md:text-xl text-white max-w-2xl mx-auto mb-6 text-center font-medium drop-shadow-md">
            Explora nuestra colección de asistentes especializados diseñados para ayudarte en diferentes áreas.
          </p>
        </section>

        {/* Sección Lista de Asistentes */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Encabezado y Búsqueda */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Todos los asistentes</h2>
              <p className="text-gray-300">Selecciona el asistente que mejor se adapte a tus necesidades</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar asistentes..."
                  className="pl-10 pr-4 py-2 bg-neutral-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Grid de Tarjetas de Asistentes */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {assistants.map((assistant) => (
              <Card 
                key={assistant.id} 
                className="bg-neutral-900/80 rounded-xl border border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm p-6 hover:-translate-y-0.5"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-center">
                    <div className={`w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4`}>
                      <IconRenderer iconType={assistant.iconType} className="h-6 w-6 text-blue-600" size={24} />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold mb-2 text-white text-center">{assistant.name}</CardTitle>
                  <CardDescription className="text-center text-gray-300">{assistant.shortDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  {assistant.description && <p className="text-gray-300">{assistant.description}</p>} 
                </CardContent>
                <CardFooter className="border-t border-gray-800 pt-4 flex justify-center">
                  <Button asChild className="relative group bg-white rounded-full px-6 py-2">
                    <Link href={`/chat/${assistant.id}`} className="relative z-10 flex items-center">
                      <span className="text-black font-bold">Chatear</span>
                      <ArrowRight className="ml-2 h-4 w-4 text-black" />
                      <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-blue-400 transition-all duration-300"></div>
                      <div className="absolute -inset-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: '0 0 8px 2px rgba(96, 165, 250, 0.5)' }}></div>
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div> 
    </div>
  );
}
