"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Globe,
  TrendingUp,
  ExternalLink,
  Filter,
  Activity,
  Eye,
  Brain,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react"
import { useState, useEffect } from "react"
import type { TalentProfile, UploadedFile } from "@/types/talent"

interface CrawlerResultsPanelProps {
  selectedTalent?: TalentProfile
  onTalentChange: (talent: TalentProfile) => void
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
}

const mockScanningStatus = {
  isScanning: true,
  currentSource: "NIL Registry",
  progress: 67,
  pagesScanned: 1247,
  newOpportunities: 3,
  estimatedTimeRemaining: "2m 15s",
}

const mockBrandDossiers = [
  {
    id: "dossier-1",
    brand: "Gatorade",
    logo: "/gatorade-logo.jpg",
    industry: "Sports Nutrition",
    marketCap: "$22.4B",
    sentiment: 0.89,
    recentActivity: "Launched new protein line targeting college athletes",
    partnerships: 47,
    avgDealValue: "$125K",
    preferredDemographics: ["College Athletes", "18-24", "High Performance"],
    riskFactors: ["Seasonal spending", "Performance-based contracts"],
    lastUpdated: "2025-01-15T10:30:00Z",
  },
  {
    id: "dossier-2",
    brand: "Under Armour",
    logo: "/under-armour-inspired-logo.png",
    industry: "Athletic Apparel",
    marketCap: "$8.1B",
    sentiment: 0.76,
    recentActivity: "Expanding NIL program for emerging sports",
    partnerships: 23,
    avgDealValue: "$85K",
    preferredDemographics: ["Emerging Sports", "16-22", "Social Media Savvy"],
    riskFactors: ["Brand repositioning", "Competitive market"],
    lastUpdated: "2025-01-15T09:45:00Z",
  },
]

const mockOpportunities = [
  {
    id: "opp-1",
    source: "NIL Registry",
    brand: "Gatorade",
    title: "Hydration Campaign Q2 2025",
    category: "Sports Nutrition",
    sentiment: 0.85,
    urgency: "high",
    deadline: "2025-02-15",
    estimatedValue: "$75K-150K",
    confidence: 0.92,
    sentimentBreakdown: {
      positive: 0.85,
      neutral: 0.12,
      negative: 0.03,
      sources: ["Press releases", "Social media", "Financial reports"],
    },
  },
  {
    id: "opp-2",
    source: "SEC Filing",
    brand: "Under Armour",
    title: "Performance Gear Partnership",
    category: "Athletic Apparel",
    sentiment: 0.78,
    urgency: "medium",
    deadline: "2025-03-01",
    estimatedValue: "$50K-100K",
    confidence: 0.87,
    sentimentBreakdown: {
      positive: 0.78,
      neutral: 0.18,
      negative: 0.04,
      sources: ["Industry reports", "Competitor analysis"],
    },
  },
  {
    id: "opp-3",
    source: "Press Release",
    brand: "Red Bull",
    title: "Extreme Sports Initiative",
    category: "Energy Drinks",
    sentiment: 0.91,
    urgency: "low",
    deadline: "2025-04-15",
    estimatedValue: "$100K-200K",
    confidence: 0.79,
    sentimentBreakdown: {
      positive: 0.91,
      neutral: 0.07,
      negative: 0.02,
      sources: ["Event announcements", "Athlete testimonials"],
    },
  },
]

const mockSources = [
  {
    name: "NIL Registry",
    status: "scanning",
    lastScan: "Live",
    opportunities: 8,
    health: "excellent",
    responseTime: "1.2s",
    successRate: 98.5,
  },
  {
    name: "SEC Filings",
    status: "active",
    lastScan: "2 min ago",
    opportunities: 3,
    health: "good",
    responseTime: "2.8s",
    successRate: 94.2,
  },
  {
    name: "Press Releases",
    status: "active",
    lastScan: "30s ago",
    opportunities: 12,
    health: "excellent",
    responseTime: "0.9s",
    successRate: 99.1,
  },
  {
    name: "Social Media",
    status: "error",
    lastScan: "1 hour ago",
    opportunities: 0,
    health: "poor",
    responseTime: "timeout",
    successRate: 45.3,
  },
]

export function CrawlerResultsPanel({
  selectedTalent,
  onTalentChange,
  files,
  onFilesChange,
}: CrawlerResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<"opportunities" | "sources" | "dossiers">("opportunities")
  const [filterUrgency, setFilterUrgency] = useState<string>("all")
  const [scanProgress, setScanProgress] = useState(mockScanningStatus.progress)

  useEffect(() => {
    if (mockScanningStatus.isScanning) {
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          const newProgress = prev + Math.random() * 3
          return newProgress > 100 ? 100 : newProgress
        })
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [])

  const filteredOpportunities = mockOpportunities.filter(
    (opp) => filterUrgency === "all" || opp.urgency === filterUrgency,
  )

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.8) return "text-green-500"
    if (sentiment >= 0.6) return "text-yellow-500"
    return "text-red-500"
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "text-green-500"
      case "good":
        return "text-blue-500"
      case "poor":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* File Context Indicator */}
      {files.length > 0 && (
        <div className="p-3 bg-secondary/50 rounded-lg border">
          <p className="text-xs text-muted-foreground">
            Using context from {files.filter((f) => f.status === "completed").length} uploaded files for targeted
            scanning
          </p>
        </div>
      )}

      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Live Market Scanning</h4>
          </div>
          <Badge variant="outline" className="gap-1 text-black">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Active
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-700 dark:text-gray-300">Scanning: {mockScanningStatus.currentSource}</span>
            <span className="text-gray-700 dark:text-gray-300">{Math.round(scanProgress)}% complete</span>
          </div>
          <Progress value={scanProgress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>{mockScanningStatus.pagesScanned.toLocaleString()} pages analyzed</span>
            <span>{mockScanningStatus.newOpportunities} new opportunities found</span>
          </div>
        </div>
      </div>

      {/* Enhanced Scan Configuration */}
      <div>
        <h4 className="text-sm font-medium mb-3">Intelligence Parameters</h4>
        <Card className="p-3 mx-0 px-5 py-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Sources</span>
              <Badge variant="default">
                {mockSources.filter((s) => s.status === "active" || s.status === "scanning").length}/4
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Scan Frequency</span>
              <span className="text-xs text-muted-foreground">Real-time + Every 5 min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">AI Sentiment Analysis</span>
              <Badge variant="outline" className="gap-1">
                <Brain className="w-3 h-3" />
                Enabled
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full bg-transparent border border-foreground">
              Configure Intelligence
            </Button>
          </div>
        </Card>
      </div>

      {/* Enhanced Results Tabs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Market Intelligence</h4>
          <div className="flex gap-1">
            <Button
              variant={activeTab === "opportunities" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("opportunities")}
            >
              Opportunities
            </Button>
            <Button
              variant={activeTab === "dossiers" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("dossiers")}
            >
              Brand Dossiers
            </Button>
            <Button
              variant={activeTab === "sources" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("sources")}
            >
              Sources
            </Button>
          </div>
        </div>

        {activeTab === "opportunities" && (
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Button
                variant={filterUrgency === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterUrgency("all")}
              >
                All
              </Button>
              <Button
                variant={filterUrgency === "high" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterUrgency("high")}
              >
                High Priority
              </Button>
              <Button
                variant={filterUrgency === "medium" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterUrgency("medium")}
              >
                Medium
              </Button>
            </div>

            {/* Enhanced Opportunities List */}
            <div className="space-y-2">
              {filteredOpportunities.map((opp) => (
                <Card key={opp.id} className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{opp.brand}</span>
                        <Badge variant={getUrgencyColor(opp.urgency)} className="text-xs">
                          {opp.urgency}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-3 h-3 ${getSentimentColor(opp.sentiment)}`} />
                        <span className="text-xs text-muted-foreground">{Math.round(opp.sentiment * 100)}%</span>
                      </div>
                    </div>
                    <p className="text-sm">{opp.title}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Sentiment Analysis</span>
                        <span className="text-muted-foreground">{opp.sentimentBreakdown.sources.length} sources</span>
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="flex-1 bg-green-200 dark:bg-green-900 h-1 rounded"
                          style={{ width: `${opp.sentimentBreakdown.positive * 100}%` }}
                        />
                        <div
                          className="flex-1 bg-gray-200 dark:bg-gray-700 h-1 rounded"
                          style={{ width: `${opp.sentimentBreakdown.neutral * 100}%` }}
                        />
                        <div
                          className="flex-1 bg-red-200 dark:bg-red-900 h-1 rounded"
                          style={{ width: `${opp.sentimentBreakdown.negative * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {opp.source} • {opp.estimatedValue}
                      </span>
                      <span>Due: {new Date(opp.deadline).toLocaleDateString()}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full gap-2">
                      <Eye className="w-3 h-3" />
                      View Brand Dossier
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "dossiers" && (
          <div className="space-y-2">
            {mockBrandDossiers.map((dossier) => (
              <Card key={dossier.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={dossier.logo || "/placeholder.svg"}
                      alt={`${dossier.brand} logo`}
                      className="w-10 h-10 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium">{dossier.brand}</h5>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(dossier.sentiment * 100)}% positive
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dossier.industry} • {dossier.marketCap}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Partnerships:</span>
                      <span className="ml-1 font-medium">{dossier.partnerships}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Deal:</span>
                      <span className="ml-1 font-medium">{dossier.avgDealValue}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Recent Activity:</p>
                    <p className="text-xs">{dossier.recentActivity}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Target Demographics:</p>
                    <div className="flex flex-wrap gap-1">
                      {dossier.preferredDemographics.map((demo, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {demo}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                    <ExternalLink className="w-3 h-3" />
                    Full Intelligence Report
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "sources" && (
          <div className="space-y-2">
            {mockSources.map((source, index) => (
              <Card key={index} className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {source.status === "scanning" && <Zap className="w-3 h-3 text-blue-500 animate-pulse" />}
                        {source.status === "active" && <CheckCircle className="w-3 h-3 text-green-500" />}
                        {source.status === "error" && <AlertCircle className="w-3 h-3 text-red-500" />}
                        {source.status === "paused" && <Clock className="w-3 h-3 text-gray-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{source.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {source.status === "scanning" ? "Scanning now..." : `Last scan: ${source.lastScan}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{source.opportunities}</p>
                      <p className="text-xs text-muted-foreground">opportunities</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        Health:
                        <span className={`ml-1 ${getHealthColor(source.health)}`}>{source.health}</span>
                      </span>
                      <span className="text-muted-foreground">Response: {source.responseTime}</span>
                    </div>
                    <span className="text-muted-foreground">{source.successRate}% success</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
