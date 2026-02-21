"use client"

import { useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Loader2, CheckCircle, AlertCircle, Users, Square, Clock } from "lucide-react"
import { useState } from "react"
import type { Deal } from "@/types/deal"
import type { TalentProfile } from "@/types/talent"

import { apiClient } from '@/services/api-client'

interface DiscoverySession {
  id: string
  talentId: string
  query: string
  deals: Deal[]
  totalProcessingTime: number
  status: "running" | "completed" | "error"
  startTime: string
}

interface AIDiscoveryEngineProps {
  selectedTalent?: TalentProfile
  query: string
  searchDurationMinutes?: number
  entityType?: "talent" | "company"
  onDealFound: (deal: Deal) => void
  onDealsFound: (deals: Deal[]) => void
  onSessionComplete: (session: DiscoverySession) => void
}

function convertStreamedDeal(deal: Record<string, unknown>): Deal {
  return {
    id: (deal.id as string) || `deal-${Date.now()}`,
    brand: (deal.brand as string) || "Unknown",
    title: `${((deal.deal_types as string[]) || [])[0] || "Partnership"} with ${deal.brand}`,
    category: ((deal.categories as string[]) || [])[0] || (deal.industry as string) || "General",
    valueRange: (deal.budget_range as string) || "$25K-100K",
    matchScore: (deal.match_score as number) || 7.0,
    description: `${((deal.match_reasons as string[]) || []).join(". ") || "Strong potential fit"}. ${(deal.recommended_approach as string) || ""}`,
    tags: [...((deal.categories as string[]) || []), ...((deal.deal_types as string[]) || [])],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    requirements: ((deal.requirements as any)?.content_types as string[]) || [],
    engagement: (deal.engagement as number) || 4.0,
    reach: (deal.reach as string) || "500K",
    conversions: `${(((deal.success_probability as number) || 0.7) * 100).toFixed(0)}%`,
    industry: (deal.industry as string) || "General",
    website: (deal.website as string) || "",
    companySize: "Enterprise",
    duration: (deal.timeline as string) || "3-6 months",
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedValue: deal.estimated_value as number,
    successProbability: deal.success_probability as number,
    priority: deal.priority as string,
    recommendedApproach: deal.recommended_approach as string,
    source: deal.source as string,
    sourceUrl: deal.source_url as string,
    campaignDetails: deal.campaign_details ? {
      deadline: (deal.campaign_details as any)?.deadline,
      requirements: (deal.campaign_details as any)?.requirements,
      compensationType: (deal.campaign_details as any)?.compensation_type,
      platformFocus: (deal.campaign_details as any)?.platform_focus,
      followUp: (deal.campaign_details as any)?.follow_up,
      urgency: (deal.campaign_details as any)?.urgency,
    } : undefined,
  }
}

const AIDiscoveryEngine = ({
  selectedTalent,
  query,
  searchDurationMinutes = 1,
  entityType = "talent",
  onDealFound,
  onDealsFound,
  onSessionComplete,
}: AIDiscoveryEngineProps) => {
  const [phase, setPhase] = useState<string>("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [dealCount, setDealCount] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [wasStopped, setWasStopped] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [processingTimeMs, setProcessingTimeMs] = useState(0)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const allDealsRef = useRef<Deal[]>([])
  const hasStartedRef = useRef(false)
  const abortControllerRef = useRef<AbortController>()

  const isB2B = entityType === "company"
  const totalDurationSeconds = searchDurationMinutes * 60
  const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds)

  const finishStream = useCallback((reason: "complete" | "stopped") => {
    clearInterval(timerRef.current)
    setIsSearching(false)
    setIsComplete(true)
    setPhase("complete")

    const elapsed = Date.now() - startTimeRef.current
    setProcessingTimeMs(elapsed)

    const msg = reason === "stopped"
      ? `Stopped — ${allDealsRef.current.length} deals found`
      : `Found ${allDealsRef.current.length} deals`
    setStatusMessage(msg)
    if (reason === "stopped") setWasStopped(true)

    onDealsFound(allDealsRef.current)
    onSessionComplete({
      id: `session-${Date.now()}`,
      talentId: selectedTalent?.id || "",
      query,
      deals: allDealsRef.current,
      totalProcessingTime: elapsed,
      status: "completed",
      startTime: new Date(startTimeRef.current).toISOString(),
    })
  }, [selectedTalent, query, onDealsFound, onSessionComplete])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    finishStream("stopped")
  }, [finishStream])

  const startDiscovery = useCallback(async () => {
    if (!selectedTalent || hasStartedRef.current) return

    hasStartedRef.current = true
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsSearching(true)
    setIsComplete(false)
    setHasError(false)
    setWasStopped(false)
    setDealCount(0)
    setPhase("loading_docs")
    setStatusMessage("Starting discovery...")
    allDealsRef.current = []

    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    const talentProfile = {
      id: selectedTalent.id,
      name: selectedTalent.name,
      category: selectedTalent.category,
      stats: selectedTalent.stats,
      demographics: selectedTalent.demographics,
      brandAlignment: selectedTalent.brandAlignment,
      documents: selectedTalent.documents,
    }

    try {
      await apiClient.streamDiscovery(
        {
          talent_id: selectedTalent.id,
          talent_name: selectedTalent.name,
          talent_profile: talentProfile,
          search_prompt: query,
          search_duration_minutes: searchDurationMinutes,
          entity_type: entityType,
        },
        {
          onStatus: (status) => {
            setPhase(status.phase)
            setStatusMessage(status.message)
            if (status.total_deals !== undefined) {
              setDealCount(status.total_deals)
            }
          },
          onDeal: (rawDeal) => {
            const deal = convertStreamedDeal(rawDeal)
            allDealsRef.current = [...allDealsRef.current, deal]
            setDealCount(allDealsRef.current.length)
            onDealFound(deal)
          },
          onComplete: (summary) => {
            clearInterval(timerRef.current)
            setProcessingTimeMs(summary.processing_time_ms)
            setDealCount(summary.total_deals)
            setIsSearching(false)
            setIsComplete(true)
            setPhase("complete")
            setStatusMessage(`Found ${summary.total_deals} deals`)

            onDealsFound(allDealsRef.current)
            onSessionComplete({
              id: `session-${Date.now()}`,
              talentId: selectedTalent.id,
              query,
              deals: allDealsRef.current,
              totalProcessingTime: summary.processing_time_ms,
              status: "completed",
              startTime: new Date(startTimeRef.current).toISOString(),
            })
          },
          onError: (error) => {
            // Abort errors are expected when user clicks Stop
            if (error.name === "AbortError" || controller.signal.aborted) return
            clearInterval(timerRef.current)
            setIsSearching(false)
            setHasError(true)
            setStatusMessage(`Error: ${error.message}`)
          },
        },
        controller.signal
      )
    } catch (error) {
      // Abort errors are expected when user clicks Stop
      if (controller.signal.aborted) return
      clearInterval(timerRef.current)
      setIsSearching(false)
      setHasError(true)
      setStatusMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }, [selectedTalent, query, searchDurationMinutes, entityType, onDealFound, onDealsFound, onSessionComplete])

  useEffect(() => {
    if (selectedTalent && !hasStartedRef.current) {
      startDiscovery()
    }
  }, [selectedTalent, startDiscovery])

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      abortControllerRef.current?.abort()
      hasStartedRef.current = false // Allow restart after Strict Mode remount
    }
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const getPhaseIcon = () => {
    if (hasError) return <AlertCircle className="w-5 h-5 text-red-500" />
    if (isComplete) return <CheckCircle className="w-5 h-5 text-green-500" />
    return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
  }

  const getPhaseLabel = () => {
    switch (phase) {
      case "loading_docs": return "Loading Documents"
      case "analyzing_profile": return isB2B ? "Analyzing Company" : "Analyzing Profile"
      case "searching": return "Searching for Deals"
      case "complete": return wasStopped ? "Discovery Stopped" : "Discovery Complete"
      default: return "Starting..."
    }
  }

  // Progress percentage based on elapsed vs total duration
  const progressPercent = phase === "searching"
    ? Math.min(95, (elapsedSeconds / totalDurationSeconds) * 100)
    : phase === "complete" ? 100 : undefined

  if (!selectedTalent) {
    return (
      <div className="flex justify-center">
        <Card className="p-6 text-center max-w-md w-full">
          <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            Select a {isB2B ? "company" : "talent"} profile to begin AI-powered deal discovery
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <Card className="p-5 w-full max-w-2xl">
        {/* Top row: phase + countdown + stop */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getPhaseIcon()}
            <div>
              <h4 className="font-medium text-sm">{getPhaseLabel()}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{statusMessage}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Countdown / elapsed */}
            {isSearching && phase === "searching" && (
              <Badge variant="outline" className="text-xs font-mono gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(remainingSeconds)} left
              </Badge>
            )}
            {isSearching && phase !== "searching" && (
              <Badge variant="outline" className="text-xs font-mono gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(elapsedSeconds)}
              </Badge>
            )}
            {isComplete && (
              <span className="text-xs text-muted-foreground">
                {formatTime(Math.floor(processingTimeMs / 1000))} total
              </span>
            )}

            {/* Stop button */}
            {isSearching && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                className="h-7 px-2.5 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Square className="w-3 h-3 fill-current" />
                Stop
              </Button>
            )}
          </div>
        </div>

        {/* Deal counter */}
        {dealCount > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="default" className="text-sm px-3 py-1">
              <Search className="w-3 h-3 mr-1.5" />
              {dealCount} deal{dealCount !== 1 ? "s" : ""} found
            </Badge>
          </div>
        )}

        {/* Progress bar */}
        {isSearching && (
          <div className="mt-3">
            {progressPercent !== undefined ? (
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse w-1/3" />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export { AIDiscoveryEngine as AIDealDiscoveryEngine, AIDiscoveryEngine }
