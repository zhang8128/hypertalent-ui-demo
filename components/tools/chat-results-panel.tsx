"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  Briefcase,
  Loader2,
} from "lucide-react"
import { useState, useEffect } from "react"
import { apiClient, type TrackedDeal } from "@/services/api-client"
import type { TalentProfile, UploadedFile } from "@/types/talent"
import type { Deal } from "@/types/deal"

interface ChatResultsPanelProps {
  selectedTalent?: TalentProfile
  onTalentChange: (talent: any) => void
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
  entityFilter: "talent" | "company"
  onEntityFilterChange: (filter: "talent" | "company") => void
  deals?: Deal[]
}

export function ChatResultsPanel({
  selectedTalent,
  onTalentChange,
  files,
  onFilesChange,
  entityFilter,
  onEntityFilterChange,
  deals: externalDeals,
}: ChatResultsPanelProps) {
  const [dealHistory, setDealHistory] = useState<TrackedDeal[]>([])
  const [isLoadingDeals, setIsLoadingDeals] = useState(false)

  // Load deal history when talent changes
  useEffect(() => {
    if (selectedTalent?.id) {
      loadDealHistory(selectedTalent.id)
    } else {
      setDealHistory([])
    }
  }, [selectedTalent?.id])

  const loadDealHistory = async (talentId: string) => {
    setIsLoadingDeals(true)
    try {
      const response = await apiClient.getTrackedDeals(talentId)
      setDealHistory(response.deals || [])
    } catch (error) {
      console.error("Failed to load deal history:", error)
      setDealHistory([])
    } finally {
      setIsLoadingDeals(false)
    }
  }

  const getQuickPrompts = () => {
    const hasTalent = !!selectedTalent
    const hasDeals = dealHistory.length > 0
    const isCompany = entityFilter === "company"

    if (!hasTalent) {
      return [
        "Draft a partnership proposal for a brand",
        "Analyze market trends in sports nutrition",
        "Create a media kit template",
        "Generate contract negotiation points",
      ]
    }

    if (isCompany) {
      return [
        `Analyze ${selectedTalent.name}'s market position`,
        `Find strategic partners for ${selectedTalent.name}`,
        ...(hasDeals ? [`Summarize ${selectedTalent.name}'s partnership history`] : []),
        "Generate a partnership pitch deck outline",
      ]
    }

    return [
      ...(hasDeals
        ? [
            `What deals does ${selectedTalent.name} have?`,
            `Tell me about the highest scoring deal`,
            `Summarize ${selectedTalent.name}'s deal history`,
          ]
        : [
            `Draft a partnership proposal for ${selectedTalent.name}`,
            `Analyze ${selectedTalent.name}'s brand alignment`,
          ]),
      `Create a media kit for ${selectedTalent.name}`,
      "Generate contract negotiation points",
    ]
  }

  const formatScore = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-600 bg-green-500/10 border-green-500/20" }
    if (score >= 60) return { label: "Good", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" }
    if (score >= 40) return { label: "Fair", color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20" }
    return { label: "Low", color: "text-muted-foreground bg-secondary border-border" }
  }

  const quickPrompts = getQuickPrompts()

  return (
    <div className="space-y-6">
      {/* Entity Toggle */}
      <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
        <button
          onClick={() => onEntityFilterChange("talent")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            entityFilter === "talent"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" />
          Talent
        </button>
        <button
          onClick={() => onEntityFilterChange("company")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            entityFilter === "company"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Company
        </button>
      </div>

      {/* Talent/Company Info Card */}
      {selectedTalent && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            {selectedTalent.avatar ? (
              <img
                src={selectedTalent.avatar}
                alt={selectedTalent.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {entityFilter === "company" ? (
                  <Building2 className="w-5 h-5 text-primary" />
                ) : (
                  <Users className="w-5 h-5 text-primary" />
                )}
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold">{selectedTalent.name}</h4>
              <p className="text-xs text-muted-foreground">{selectedTalent.category}</p>
            </div>
          </div>

          {/* Stats */}
          {selectedTalent.stats && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-secondary/30 rounded">
                <p className="text-lg font-bold">
                  {selectedTalent.stats.followers >= 1000
                    ? `${(selectedTalent.stats.followers / 1000).toFixed(1)}k`
                    : selectedTalent.stats.followers}
                </p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="text-center p-2 bg-secondary/30 rounded">
                <p className="text-lg font-bold">{selectedTalent.stats.engagement}%</p>
                <p className="text-xs text-muted-foreground">Engagement</p>
              </div>
              <div className="text-center p-2 bg-secondary/30 rounded">
                <p className="text-lg font-bold">{selectedTalent.stats.deals}</p>
                <p className="text-xs text-muted-foreground">Deals</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* File Context Indicator */}
      {files.filter((f) => f.status === "completed").length > 0 && (
        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
          <p className="text-xs text-green-700 dark:text-green-400 font-medium">
            Using context from {files.filter((f) => f.status === "completed").length} uploaded files
          </p>
        </div>
      )}

      {/* Deal History Section */}
      {selectedTalent && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Deal History
              {dealHistory.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {dealHistory.length} deals
                </Badge>
              )}
            </h4>
            {isLoadingDeals && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>

          {!isLoadingDeals && dealHistory.length === 0 && (
            <Card className="p-4 text-center">
              <Briefcase className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No deals found for this {entityFilter}.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use Deal Hunter to discover opportunities.
              </p>
            </Card>
          )}

          {dealHistory.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dealHistory.slice(0, 10).map((deal) => {
                const scoreInfo = formatScore(deal.match_score || 0)
                return (
                  <Card key={deal.deal_id} className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{deal.brand || "Unknown Brand"}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${scoreInfo.color}`}
                        >
                          {deal.match_score ? `${Math.round(deal.match_score)}%` : "N/A"}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {deal.status || "potential"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {deal.industry && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {deal.industry}
                        </span>
                      )}
                      {deal.budget_range && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {deal.budget_range}
                        </span>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Prompts */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Quick Prompts
        </h4>
        <div className="space-y-2">
          {quickPrompts.map((prompt, index) => (
            <Card key={index} className="p-3 hover:bg-secondary/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-foreground">{prompt}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
