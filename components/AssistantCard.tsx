import Link from "next/link";
import { Cpu } from "lucide-react";

interface AssistantCardProps {
  title: string;
  description: string;
  route: string;
  badge?: string;
  badgeColor?: string;
  icon?: string;
}

export function AssistantCard({
  title,
  description,
  route,
  badge,
  badgeColor = "bg-blue-500",
  icon,
}: AssistantCardProps) {
  return (
    <Link href={route}>
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold flex items-center">
            {icon === "cpu" && <Cpu className="mr-2 h-5 w-5 text-emerald-500" />}
            {title}
          </h2>
          {badge && (
            <span className={`px-2 py-1 text-xs ${badgeColor} text-white rounded-full`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-gray-600 flex-grow">{description}</p>
        <div className="mt-4 text-sm text-blue-500 hover:underline">Iniciar chat</div>
      </div>
    </Link>
  );
}
