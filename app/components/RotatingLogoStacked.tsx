"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"

export default function RotatingLogoStacked() {
  const [rotation, setRotation] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset
      setRotation(scrollY * 0.4)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative">
      {/* Fondo: logo girando, fijo y centrado en la pantalla, blur y opacidad baja */}
      <div className="fixed inset-0 flex justify-center items-center z-0 pointer-events-none" 
           style={{filter:'blur(12px)', opacity:0.20}}>
        <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
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
      </div>

      {/* Foreground: logo + texto como antes */}
      <div className="relative w-[450px] h-[450px] mx-auto mb-6 mt-8 select-none z-10">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ width: '380px', height: '380px' }}>
          <Image
            src="/LogosNuevos/logo_orbia_sin_texto.png"
            alt="Logo Orbia Sin Texto"
            fill
            priority
            className="object-contain"
            style={{ 
              transform: `rotate(${rotation}deg)`, 
              transition: 'transform 0.1s linear',
              zIndex: 1 
            }}
          />
        </div>
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ width: '220px', height: '220px' }}>
          <Image
            src="/LogosNuevos/orbia_text_transparent.png"
            alt="Orbia Texto"
            fill
            priority
            className="object-contain"
            style={{ 
              pointerEvents: 'none', 
              zIndex: 2 
            }}
          />
        </div>
      </div>
    </div>
  )
}
