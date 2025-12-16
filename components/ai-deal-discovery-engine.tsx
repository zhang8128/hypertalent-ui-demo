"use client"

import type { ReactNode } from "react"
import { useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, FileSearch, Target, Zap, CheckCircle, AlertCircle, TrendingUp, Users
} from "lucide-react"
import { useState } from "react"
import type { Deal } from "@/types/deal"
import type { TalentProfile } from "./talent-profile-manager"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://qaqyqok7j0.execute-api.us-east-1.amazonaws.com'

interface AIAgent {
  id: string
  name: string
  description: string
  status: "idle" | "running" | "completed" | "error"
  progress: number
  results?: any
  processingTime?: number
  icon: ReactNode
}

interface DiscoverySession {
  id: string
  talentId: string
  query: string
  agents: AIAgent[]
  deals: Deal[]
  totalProcessingTime: number
  status: "running" | "completed" | "error"
  startTime: string
}

interface AIDiscoveryEngineProps {
  selectedTalent?: TalentProfile
  query: string
  searchDurationMinutes?: number
  onDealsFound: (deals: Deal[]) => void
  onSessionComplete: (session: DiscoverySession) => void
}

const AIDiscoveryEngine = ({ selectedTalent, query, searchDurationMinutes = 1, onDealsFound, onSessionComplete }: AIDiscoveryEngineProps) => {
  const [session, setSession] = useState<DiscoverySession | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const initializeAgents = (): AIAgent[] => [
    {
      id: "file_processor",
      name: "File Processor Agent",
      description: "Analyzes uploaded documents to extract talent metrics, audience data, and performance indicators",
      status: "idle",
      progress: 0,
      icon: <FileSearch className="w-4 h-4" />,
    },
    {
      id: "profile_analyzer",
      name: "Profile Analyzer Agent",
      description: "Processes talent profile data to identify strengths, audience demographics, and brand alignment",
      status: "idle",
      progress: 0,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "deal_matcher",
      name: "Deal Matcher Agent",
      description: "Searches brand partnership database using AI similarity scoring and compatibility analysis",
      status: "idle",
      progress: 0,
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: "opportunity_scorer",
      name: "Opportunity Scorer Agent",
      description: "Ranks and scores deal opportunities based on talent fit, value potential, and success probability",
      status: "idle",
      progress: 0,
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ]

  const convertApiDealsToFrontend = (apiDeals: any[]): Deal[] => {
    return apiDeals.map((deal, index) => ({
      id: deal.id || `deal-${Date.now()}-${index}`,
      brand: deal.brand,
      title: `${deal.deal_types?.[0] || 'Partnership'} with ${deal.brand}`,
      category: deal.categories?.[0] || deal.industry || 'General',
      valueRange: deal.budget_range || '$25K-100K',
      matchScore: deal.match_score || 7.0,
      description: `${deal.match_reasons?.join('. ') || 'Strong potential fit'}. ${deal.recommended_approach || ''}`,
      tags: [...(deal.categories || []), ...(deal.deal_types || [])],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      requirements: deal.requirements?.content_types || [],
      engagement: deal.engagement || 4.0,
      reach: deal.reach || "500K",
      conversions: `${(deal.success_probability * 100 || 70).toFixed(0)}%`,
      industry: deal.industry || 'General',
      companySize: "Enterprise",
      duration: deal.timeline || "3-6 months",
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      contact: {
        name: `${deal.brand} Partnership Team`,
        email: `partnerships@${deal.brand?.toLowerCase().replace(/\s+/g, '')}.com`,
        department: "Brand Partnerships",
      },
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Additional fields from API
      estimatedValue: deal.estimated_value,
      successProbability: deal.success_probability,
      priority: deal.priority,
      recommendedApproach: deal.recommended_approach,
    }))
  }

  const runAgentWithProgress = async (
    agentId: string,
    agents: AIAgent[],
    apiCall: () => Promise<any>
  ): Promise<{ agents: AIAgent[], result: any }> => {
    // Update agent to running status
    let updatedAgents = agents.map((agent) =>
      agent.id === agentId ? { ...agent, status: "running" as const, progress: 0 } : agent
    )
    setSession((prev) => (prev ? { ...prev, agents: updatedAgents } : null))

    // Simulate progress while waiting for API
    const progressInterval = setInterval(() => {
      updatedAgents = updatedAgents.map((agent) => {
        if (agent.id === agentId && agent.status === "running") {
          const newProgress = Math.min(agent.progress + Math.random() * 15, 90)
          return { ...agent, progress: newProgress }
        }
        return agent
      })
      setSession((prev) => (prev ? { ...prev, agents: updatedAgents } : null))
    }, 500)

    try {
      // Call the real API
      const result = await apiCall()

      clearInterval(progressInterval)

      // Update agent to completed
      updatedAgents = updatedAgents.map((agent) =>
        agent.id === agentId
          ? {
              ...agent,
              status: "completed" as const,
              progress: 100,
              results: result.results,
              processingTime: result.processing_time_ms,
            }
          : agent
      )
      setSession((prev) => (prev ? { ...prev, agents: updatedAgents } : null))

      return { agents: updatedAgents, result }
    } catch (error) {
      clearInterval(progressInterval)

      // Update agent to error
      updatedAgents = updatedAgents.map((agent) =>
        agent.id === agentId
          ? { ...agent, status: "error" as const, progress: 0 }
          : agent
      )
      setSession((prev) => (prev ? { ...prev, agents: updatedAgents } : null))

      throw error
    }
  }

  const startDiscovery = useCallback(async () => {
    if (!selectedTalent) return

    setIsRunning(true)
    const sessionId = `session-${Date.now()}`
    const startTime = new Date().toISOString()

    const newSession: DiscoverySession = {
      id: sessionId,
      talentId: selectedTalent.id,
      query,
      agents: initializeAgents(),
      deals: [],
      totalProcessingTime: 0,
      status: "running",
      startTime,
    }

    setSession(newSession)

    try {
      let currentAgents = newSession.agents
      let documents: Record<string, string> = {}
      let talentDna: any = {}
      let matchedDeals: any[] = []

      // Convert frontend talent profile to API format
      const talentProfile = {
        id: selectedTalent.id,
        name: selectedTalent.name,
        category: selectedTalent.category,
        stats: selectedTalent.stats,
        demographics: selectedTalent.demographics,
        brandAlignment: selectedTalent.brandAlignment,
        documents: selectedTalent.documents,
      }

      // Agent 1: File Processor
      const agent1Result = await runAgentWithProgress(
        "file_processor",
        currentAgents,
        async () => {
          const response = await fetch(`${API_URL}/api/discovery/agent/file-processor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              talent_id: selectedTalent.id,
              talent_name: selectedTalent.name,
              talent_profile: talentProfile,
            })
          })
          if (!response.ok) throw new Error('File processor failed')
          return response.json()
        }
      )
      currentAgents = agent1Result.agents
      documents = agent1Result.result.documents || {}

      // Agent 2: Profile Analyzer
      const agent2Result = await runAgentWithProgress(
        "profile_analyzer",
        currentAgents,
        async () => {
          const response = await fetch(`${API_URL}/api/discovery/agent/profile-analyzer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              talent_id: selectedTalent.id,
              talent_name: selectedTalent.name,
              talent_profile: talentProfile,
              documents,
            })
          })
          if (!response.ok) throw new Error('Profile analyzer failed')
          return response.json()
        }
      )
      currentAgents = agent2Result.agents
      talentDna = agent2Result.result.talent_dna || {}

      // Agent 3: Deal Matcher (now uses AI search with the query)
      const agent3Result = await runAgentWithProgress(
        "deal_matcher",
        currentAgents,
        async () => {
          const response = await fetch(`${API_URL}/api/discovery/agent/deal-matcher`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              talent_id: selectedTalent.id,
              talent_name: selectedTalent.name,
              talent_profile: talentProfile,
              talent_dna: talentDna,
              search_prompt: query,
              search_duration_minutes: searchDurationMinutes,
            })
          })
          if (!response.ok) throw new Error('Deal matcher failed')
          return response.json()
        }
      )
      currentAgents = agent3Result.agents
      matchedDeals = agent3Result.result.matched_deals || []

      // Agent 4: Opportunity Scorer
      const agent4Result = await runAgentWithProgress(
        "opportunity_scorer",
        currentAgents,
        async () => {
          const response = await fetch(`${API_URL}/api/discovery/agent/opportunity-scorer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              talent_id: selectedTalent.id,
              talent_name: selectedTalent.name,
              talent_profile: talentProfile,
              talent_dna: talentDna,
              matched_deals: matchedDeals,
            })
          })
          if (!response.ok) throw new Error('Opportunity scorer failed')
          return response.json()
        }
      )
      currentAgents = agent4Result.agents
      const scoredDeals = agent4Result.result.scored_deals || []

      // Convert API deals to frontend format
      const finalDeals = convertApiDealsToFrontend(scoredDeals)
      const totalTime = currentAgents.reduce((sum, agent) => sum + (agent.processingTime || 0), 0)

      const completedSession: DiscoverySession = {
        ...newSession,
        agents: currentAgents,
        deals: finalDeals,
        totalProcessingTime: totalTime,
        status: "completed",
      }

      setSession(completedSession)
      onDealsFound(finalDeals)
      onSessionComplete(completedSession)
    } catch (error) {
      console.error("Discovery session error:", error)
      setSession((prev) => (prev ? { ...prev, status: "error" } : null))
    } finally {
      setIsRunning(false)
    }
  }, [selectedTalent, query, searchDurationMinutes, onDealsFound, onSessionComplete])

  useEffect(() => {
    if (selectedTalent && !session && !isRunning) {
      startDiscovery()
    }
  }, [selectedTalent, session, isRunning, startDiscovery])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "running":
        return <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
      default:
        return <div className="w-4 h-4 rounded-full bg-muted" />
    }
  }

  return (
    <div className="space-y-6 mx-8">
      <div className="mb-6">


      </div>

      {!selectedTalent && (
        <Card className="p-6 text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Select a talent profile to begin AI-powered deal discovery</p>
        </Card>
      )}

      {session && (
        <div className="space-y-4">
          {/* Session Overview */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium">Discovery Session</h4>
                <p className="text-sm text-muted-foreground">
                  Started {new Date(session.startTime).toLocaleTimeString()}
                </p>
              </div>
              <Badge className="text-secondary" variant={session.status === "completed" ? "default" : "secondary"}>{session.status}</Badge>
            </div>

            {session.status === "completed" && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-bold text-primary text-4xl">{session.deals.length}</div>
                  <p className="text-xs text-muted-foreground">Deals Found</p>
                </div>
                <div>
                  <div className="font-bold text-primary text-4xl">
                    {session.deals.length > 0
                      ? (session.deals.reduce((sum, deal) => sum + deal.matchScore, 0) / session.deals.length).toFixed(
                          1,
                        )
                      : "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Match Score</p>
                </div>
                <div>
                  <div className="font-bold text-primary text-4xl">
                    {(session.totalProcessingTime / 1000).toFixed(1)}s
                  </div>
                  <p className="text-xs text-muted-foreground">Processing Time</p>
                </div>
              </div>
            )}
          </Card>

          {/* AI Agents Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {session.agents.map((agent) => (
              <Card key={agent.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">{agent.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-sm">{agent.name}</h5>
                      {getStatusIcon(agent.status)}
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">{agent.description}</p>

                    {agent.status === "running" && (
                      <div className="space-y-2">
                        <Progress value={agent.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">{agent.progress.toFixed(0)}% complete</p>
                      </div>
                    )}

                    {agent.status === "completed" && agent.results && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>Completed in {((agent.processingTime || 0) / 1000).toFixed(1)}s</span>
                        </div>

                        {agent.id === "deal_matcher" && agent.results.deals_found !== undefined && (
                          <div className="flex items-center gap-2 text-xs">
                            <Target className="w-3 h-3" />
                            <span>{agent.results.deals_found} deals found</span>
                          </div>
                        )}

                        {agent.id === "file_processor" && agent.results.documents_processed !== undefined && (
                          <div className="flex items-center gap-2 text-xs">
                            <FileSearch className="w-3 h-3" />
                            <span>{agent.results.documents_processed} documents processed</span>
                          </div>
                        )}

                        {agent.id === "opportunity_scorer" && agent.results.high_priority_deals !== undefined && (
                          <div className="flex items-center gap-2 text-xs">
                            <TrendingUp className="w-3 h-3" />
                            <span>{agent.results.high_priority_deals} high-priority deals</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { AIDiscoveryEngine as AIDealDiscoveryEngine, AIDiscoveryEngine }
