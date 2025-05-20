import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="mt-auto z-20 p-3 md:p-4 border-t border-white/5 bg-gray-900/80 backdrop-blur-md">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative h-5 w-5">
              <Image
                src="/LogosNuevos/logo_orbia_sin_texto.png"
                alt="Orbia Logo"
                fill
                className="object-contain opacity-80"
                sizes="20px"
              />
            </div>
            <span className="text-xs text-gray-400">
              © {new Date().getFullYear()} Orbia. Todos los derechos reservados.
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="#" 
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Términos
            </Link>
            <Link 
              href="#" 
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Privacidad
            </Link>
            <Link 
              href="#" 
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
