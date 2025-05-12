"use client"

import * as LucideIcons from "lucide-react"
import { LucideProps } from "lucide-react"

interface IconRendererProps {
  iconType: string
  className?: string
  size?: number
}

export function IconRenderer({ iconType, className = "", size = 24 }: IconRendererProps) {
  // Convert kebab-case to PascalCase if needed (e.g., "file-text" to "FileText")
  const iconName = iconType.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join("");
  
  // Access the Lucide icon by its name
  // Cast to any to avoid TypeScript issues with dynamic access
  const LucideIcon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle; // Fallback icon

  return <LucideIcon className={className} size={size} />;
}
