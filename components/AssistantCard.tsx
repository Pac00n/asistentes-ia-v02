import Link from "next/link";
import { Cpu, MessageCircle } from "lucide-react";

interface AssistantCardProps {
  title: string;
  description: string;
  route: string;
  badge?: string;
  badgeColor?: string;
  icon?: string;
  className?: string;
}

export function AssistantCard({
  title,
  description,
  route,
  badge,
  badgeColor = "bg-blue-100 text-blue-800",
  icon,
  className = "",
}: AssistantCardProps) {
  const renderIcon = () => {
    switch (icon) {
      case "cpu":
        return <Cpu className="mr-2 h-5 w-5 text-emerald-500" />;
      case "message-circle":
        return <MessageCircle className="mr-2 h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <Link href={route} className={`h-full ${className}`}>
      <div className="h-full border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 flex flex-col bg-white">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            {renderIcon()}
            {title}
          </h2>
          {badge && (
            <span 
              className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${badgeColor} whitespace-nowrap`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-gray-600 flex-grow">{description}</p>
        <div className="mt-6">
          <span className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Iniciar chat
            <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
