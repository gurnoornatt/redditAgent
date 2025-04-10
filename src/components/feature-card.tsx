import type { LucideIcon } from "lucide-react"
import * as LucideIcons from "lucide-react"
import GlassCard from "./glass-card"

interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  // Dynamically get the icon from Lucide
  const Icon = LucideIcons[icon as keyof typeof LucideIcons] as LucideIcon

  return (
    <GlassCard className="h-full transition-transform duration-300 hover:scale-105">
      <div className="p-6 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-cyan-900/50 flex items-center justify-center mb-4">
          {Icon && <Icon className="h-6 w-6 text-cyan-400" />}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </GlassCard>
  )
}
