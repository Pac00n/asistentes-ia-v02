'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Menu, Home, Zap, Search, MessageCircle, Globe, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? 'hidden' : '';
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
      {/* Menú flotante */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={toggleMenu}
          className="flex flex-col items-center justify-center w-12 h-12 bg-blue-600 rounded-lg focus:outline-none"
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className={`block w-6 h-0.5 bg-white rounded-full mb-1.5 transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-white rounded-full mb-1.5 transition-opacity ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`block w-6 h-0.5 bg-white rounded-full transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* Overlay y menú lateral */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <motion.div 
            className="fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 relative">
                    <Image 
                      src="/LogosNuevos/logo_orbia_sin_texto.png" 
                      alt="Orbia Logo" 
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xl font-bold text-gray-900">Orbia IA</span>
                </div>
              </div>
              
              <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-2">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <span className="mr-3 text-gray-500">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              
              <div className="p-4 border-t border-gray-200">
                <Link
                  href="/chat"
                  onClick={closeMenu}
                  className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Empezar
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}
