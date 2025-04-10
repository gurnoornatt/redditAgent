"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Sparkles, TrendingUp, MessageSquare, Send, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GlassCard from "@/components/glass-card"
import AnimatedBackground from "@/components/animated-background"
import ContentIdea from "@/components/content-idea"
import { generateContentIdeas, checkApiHealth } from "@/lib/api-client"
import { extractSubredditName, isValidSubredditName } from "@/lib/utils"

export default function AgentPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<any>(null)
  const [apiConnected, setApiConnected] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check API health on component mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const isHealthy = await checkApiHealth()
        setApiConnected(isHealthy)
        if (!isHealthy) {
          setError("Backend API is not available. Please ensure the Flask server is running.")
        }
      } catch (error) {
        setApiConnected(false)
        setError("Failed to connect to the backend API. Please ensure the Flask server is running.")
      }
    }
    
    checkHealth()
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    const subreddit = extractSubredditName(searchQuery)
    
    if (!isValidSubredditName(subreddit)) {
      setError("Please enter a valid subreddit name (3-21 characters, letters, numbers, or underscores).")
      return
    }
    
    setIsAnalyzing(true)
    setError(null)

    try {
      // Call our backend API
      const data = await generateContentIdeas(subreddit)
      setResults(data)
    } catch (error) {
      console.error("Error analyzing subreddit:", error)
      setError(`Error analyzing subreddit: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <AnimatedBackground />

      <div className="container relative z-10 mx-auto px-4 py-8">
        <nav className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <span className="text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              REDDIT INSIGHT
            </span>
          </div>
        </nav>

        <GlassCard className="mb-8">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Reddit Content Analyzer</h1>
            <p className="text-gray-300 mb-6">
              Enter a subreddit name to analyze discussions and generate content ideas based on user pain points.
            </p>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter subreddit (e.g., productivity, marketing, ADHD)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-gray-900/50 border-gray-700 focus-visible:ring-cyan-500"
                disabled={isAnalyzing}
              />
              <Button
                onClick={handleSearch}
                disabled={isAnalyzing || !apiConnected}
                className="bg-cyan-500 hover:bg-cyan-400 text-black"
              >
                {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-md text-red-300 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {!apiConnected && !error && (
              <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-800 rounded-md text-yellow-300 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p>Cannot connect to the backend API. Please ensure the Flask server is running.</p>
              </div>
            )}
          </div>
        </GlassCard>

        {results && (
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 mb-6">
              <TabsTrigger
                value="insights"
                className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-400"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger
                value="pain-points"
                className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-400"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Pain Points
              </TabsTrigger>
              <TabsTrigger
                value="content-ideas"
                className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-400"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Content Ideas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="mt-0">
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Analysis Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-cyan-400 mb-1 text-sm font-medium">Subreddit</div>
                      <div className="text-2xl font-bold">r/{results.subreddit}</div>
                      <div className="text-gray-400 text-sm">
                        {results.metadata && results.metadata.platform}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-cyan-400 mb-1 text-sm font-medium">Total Pain Points</div>
                      <div className="text-2xl font-bold">{results.metadata?.total_pain_points || 0}</div>
                      <div className="text-gray-400 text-sm">Identified issues & challenges</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-cyan-400 mb-1 text-sm font-medium">Content Ideas</div>
                      <div className="text-2xl font-bold">
                        {(results.content_ideas?.tiktok?.length || 0) + (results.content_ideas?.instagram?.length || 0)}
                      </div>
                      <div className="text-gray-400 text-sm">For TikTok & Instagram</div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="pain-points" className="mt-0">
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Identified Pain Points</h2>
                  <div className="space-y-3">
                    {results.pain_points && results.pain_points.length > 0 ? (
                      results.pain_points.map((point: string, index: number) => (
                        <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                          <p className="text-gray-200">{point}</p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <p className="text-gray-400">No pain points identified in this subreddit.</p>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="content-ideas" className="mt-0">
              <div className="space-y-6">
                <GlassCard>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">TikTok Content Ideas</h2>
                    <div className="space-y-3">
                      {results.content_ideas?.tiktok && results.content_ideas.tiktok.length > 0 ? (
                        results.content_ideas.tiktok.map((idea: string, index: number) => (
                          <ContentIdea
                            key={`tiktok-${index}`}
                            title={idea}
                            source={`r/${results.subreddit}`}
                            platform="TikTok"
                          />
                        ))
                      ) : (
                        <p className="text-gray-400">No TikTok content ideas generated.</p>
                      )}
                    </div>
                  </div>
                </GlassCard>
                
                <GlassCard>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Instagram Content Ideas</h2>
                    <div className="space-y-3">
                      {results.content_ideas?.instagram && results.content_ideas.instagram.length > 0 ? (
                        results.content_ideas.instagram.map((idea: string, index: number) => (
                          <ContentIdea
                            key={`instagram-${index}`}
                            title={idea}
                            source={`r/${results.subreddit}`}
                            platform="Instagram"
                          />
                        ))
                      ) : (
                        <p className="text-gray-400">No Instagram content ideas generated.</p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  )
}
