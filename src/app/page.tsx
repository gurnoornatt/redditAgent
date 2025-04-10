import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import AnimatedBackground from "@/components/animated-background"
import GlassCard from "@/components/glass-card"
import FeatureCard from "@/components/feature-card"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <AnimatedBackground />

      <div className="container relative z-10 mx-auto px-4 py-20">
        <nav className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-cyan-400" />
            <span className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              REDDIT INSIGHT
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30">
              Features
            </Button>
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30">
              About
            </Button>
            <Link href="/agent">
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-black">Launch App</Button>
            </Link>
          </div>
        </nav>

        <div className="flex flex-col items-center text-center mt-20 mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400">
              Discover Content Ideas
            </span>
            <br />
            <span>From Reddit's Collective Mind</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mb-10">
            Our AI agent analyzes Reddit conversations in real-time to identify trending topics, pain points, and
            content opportunities for your next viral creation.
          </p>
          <Link href="/agent">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-medium px-8 py-6 rounded-full group transition-all duration-300 transform hover:scale-105"
            >
              Try Product
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-20">
          <FeatureCard
            icon="Zap"
            title="Real-time Analysis"
            description="Our AI constantly monitors subreddits to identify emerging trends and discussions."
          />
          <FeatureCard
            icon="Target"
            title="Pain Point Detection"
            description="Automatically identify user problems and needs that your content can address."
          />
          <FeatureCard
            icon="Lightbulb"
            title="Content Inspiration"
            description="Generate short-form content ideas based on what's resonating with Reddit communities."
          />
        </div>

        <GlassCard className="my-20">
          <div className="flex flex-col md:flex-row items-center gap-8 p-8">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Powered by Advanced AI
              </h2>
              <p className="text-gray-300 mb-6">
                Our sophisticated algorithm doesn't just scrape content—it understands context, sentiment, and
                engagement patterns to deliver insights that truly matter.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full bg-cyan-900/50 text-cyan-400 text-sm">
                  Natural Language Processing
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-900/50 text-blue-400 text-sm">Sentiment Analysis</span>
                <span className="px-3 py-1 rounded-full bg-cyan-900/50 text-cyan-400 text-sm">Trend Prediction</span>
              </div>
            </div>
            <div className="w-full md:w-1/2 h-64 rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 z-10"></div>
              <img src="/cybernetic-lattice.png" alt="AI Visualization" className="w-full h-full object-cover" />
            </div>
          </div>
        </GlassCard>

        <div className="text-center mt-32 mb-20">
          <h2 className="text-4xl font-bold mb-10">Ready to Transform Your Content Strategy?</h2>
          <Link href="/agent">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-medium px-8 py-6 rounded-full group transition-all duration-300 transform hover:scale-105"
            >
              Start Discovering Ideas
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>

      <footer className="relative z-10 border-t border-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <span className="text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                REDDIT INSIGHT
              </span>
            </div>
            <div className="text-gray-500 text-sm">© 2150 Reddit Insight. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </main>
  )
}
