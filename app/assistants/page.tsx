"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Search } from "lucide-react"
import { assistants } from "@/lib/assistants"
import { IconRenderer } from "@/components/ui/icon-renderer"

export default function AssistantsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Nuestros Asistentes</h1>
          <p className="text-xl text-blue-50 max-w-2xl">
            Explora nuestra colección de asistentes especializados diseñados para ayudarte en diferentes áreas.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-12 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Todos los asistentes</h2>
            <p className="text-gray-600">Selecciona el asistente que mejor se adapte a tus necesidades</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar asistentes..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistants.map((assistant) => (
            <Card key={assistant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${assistant.bgColor}`}>
                    {/* Renderizar el icono basado en iconType */}
                    <IconRenderer iconType={assistant.iconType} className="h-6 w-6 text-white" size={24} />
                  </div>
                  <Badge variant={assistant.badgeVariant}>{assistant.category}</Badge>
                </div>
                <CardTitle className="mt-4">{assistant.name}</CardTitle>
                <CardDescription>{assistant.shortDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{assistant.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {assistant.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="bg-gray-100">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <div className="text-sm text-gray-500">{assistant.messageCount} mensajes este mes</div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/chat/${assistant.id}`}>
                    Chatear
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
