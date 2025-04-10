import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
}

export default function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden backdrop-blur-md bg-gray-900/30 border border-gray-800/50",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-cyan-500/10 before:to-blue-600/5",
        "after:absolute after:inset-0 after:bg-gradient-to-br after:from-transparent after:to-cyan-900/10",
        className,
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  )
}
