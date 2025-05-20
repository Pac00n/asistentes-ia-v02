'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Menu, Home, Zap, Search, MessageCircle, Globe, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // isScrolled no se usa actualmente en el Navbar flotante, se podría quitar si no se va a usar.
  // const [isScrolled, setIsScrolled] = useState(false);

  // useEffect(() => {
  //   const handleScroll = () => {
  //     setIsScrolled(window.scrollY > 10);
  //   };
  //   window.addEventListener('scroll', handleScroll);
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Solo bloquear scroll si el menú está abierto y es la primera vez (evitar múltiples cambios)
    if (!isMenuOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.style.overflow = '';
  };

  const menuItems = [
    { name: 'Inicio', href: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Características', href: '/#features', icon: <Zap className="w-5 h-5" /> },
    { name: 'Asistentes', href: '/assistants', icon: <MessageCircle className="w-5 h-5" /> },
    { name: 'Acerca de', href: '/#about', icon: <Globe className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Botón de Menú Flotante Rediseñado */}
      <div className="fixed top-4 left-4 z-[100]"> {/* Aumentado z-index por si acaso */}
        <motion.button
          onClick={toggleMenu}
          className={`p-3 rounded-full flex items-center justify-center 
                      focus:outline-none transition-all duration-200 ease-in-out
                      bg-gray-800/60 hover:bg-gray-700/80 text-white
                      shadow-lg backdrop-blur-sm w-12 h-12`} // Tamaño explícito para el botón
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          whileHover={{ scale: 1.1, rotate: isMenuOpen ? 0 : 10 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, transition: { delay: 0.2 } }}
        >
          <AnimatePresence initial={false} mode="wait">
            {isMenuOpen ? (
              <motion.div
                key="x"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.2 }}
              >
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.2 }}
              >
                <Menu size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Overlay y menú lateral */}
      {isMenuOpen && (
        <>
          <motion.div 
            className="fixed inset-0 bg-black/50 z-[90]" // z-index menor que el botón pero mayor que el contenido
            onClick={closeMenu}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div 
            className="fixed top-0 left-0 h-full w-72 bg-gray-900 text-gray-100 z-[100] shadow-2xl border-r border-gray-700"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: 'spring', stiffness: 320, damping: 35 }}
          >
            <div className="h-full flex flex-col">
              <div className="p-5 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 relative">
                    <Image 
                      src="/LogosNuevos/logo_orbia_sin_texto.png" 
                      alt="Orbia Logo" 
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-500">
                    Orbia IA
                  </span>
                </div>
                <motion.button 
                    onClick={closeMenu} 
                    className="p-2 rounded-full hover:bg-gray-700/70"
                    whileHover={{scale: 1.1}}
                    whileTap={{scale: 0.9}}
                >
                    <X size={20} className="text-gray-400"/>
                </motion.button>
              </div>
              
              <nav className="flex-1 p-4 overflow-y-auto space-y-1.5">
                {menuItems.map((item) => (
                  <li key={item.name} className="list-none">
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      className="flex items-center px-3 py-2.5 text-gray-300 hover:bg-orange-500/15 hover:text-orange-300 rounded-lg transition-all duration-150 ease-in-out group"
                    >
                      <span className="mr-3 text-gray-400 group-hover:text-orange-400 transition-colors">{item.icon}</span>
                      <span className="font-medium text-sm">{item.name}</span>
                    </Link>
                  </li>
                ))}
              </nav>
              
              <div className="p-4 border-t border-gray-700">
                <Link
                  href="/chat" // Debería ser /assistants o una página de login/dashboard
                  onClick={closeMenu}
                  className="flex items-center justify-center w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Empezar Ahora
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}
