import { Sparkles, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import GlassCard from "./glass-card"

interface ContentIdeaProps {
  title: string
  source: string
  sentiment?: string
  platform?: string
}

export default function ContentIdea({ title, source, sentiment, platform }: ContentIdeaProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "text-green-400"
      case "frustrated":
        return "text-orange-400"
      case "questioning":
        return "text-yellow-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <GlassCard className="h-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,180,216,0.3)]">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-gray-400">
              {platform ? `${platform} Idea` : "Content Idea"}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => {
              navigator.clipboard.writeText(title);
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <h3 className="text-xl font-bold mb-3">{title}</h3>

        <div className="flex items-center justify-between text-sm">
          <div>
            Based on: <span className="text-cyan-400">{source}</span>
          </div>
          {sentiment && (
            <div>
              Sentiment: <span className={getSentimentColor(sentiment)}>{sentiment}</span>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
