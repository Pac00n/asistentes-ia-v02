"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart, Home, Settings, Server, Zap } from "lucide-react";

export function DashboardNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Inicio",
      href: "/",
      icon: Home
    },
    {
      name: "Asistentes",
      href: "/assistants",
      icon: Zap
    },
    {
      name: "Dashboard MCP",
      href: "/dashboard",
      icon: BarChart
    },
    {
      name: "Consentimientos",
      href: "/settings/consents",
      icon: Settings
    },
  ];

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 py-4 px-8 border-b bg-background">
      <div className="mr-6">
        <a href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">Orbia</span>
        </a>
      </div>
      
      <div className="flex-1 flex items-center space-x-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          
          return (
            <a 
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center h-9 px-4 py-2 rounded-md",
                isActive 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.name}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
