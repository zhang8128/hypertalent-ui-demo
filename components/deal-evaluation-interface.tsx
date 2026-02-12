"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Grid,
  List,
  DollarSign,
  TrendingUp,
  Target,
  BarChart3,
  Eye,
  Mail,
  Download,
  SortAsc,
  SortDesc,
  Search,
  Clock,
  MessageCircle,
  CheckCircle2,
  XCircle,
  User,
  Linkedin,
  Phone,
  Loader2,
  UserSearch,
  ExternalLink,
} from "lucide-react"
import { useState, useMemo } from "react"
import type { Deal } from "@/types/deal"
import type { TalentProfile } from "@/types/talent"

interface DealEvaluationInterfaceProps {
  deals: Deal[]
  selectedTalent?: TalentProfile
  onViewDetails: (deal: Deal) => void
  onViewContact?: (deal: Deal) => void
  onGenerateOutreach: (deal: Deal) => void
  onExportDeals: (deals: Deal[]) => void
  onStatusChange?: (dealId: string, status: Deal['status']) => void
  onFindContact?: (deal: Deal) => Promise<void>
  findingContactForDealId?: string  // Track which deal is currently being enriched
  contactNotFoundDealIds?: Set<string>  // Deals where contact search returned no results
}

interface EvaluationFilters {
  search: string
  category: string
  valueRange: string
  minScore: number
  maxScore: number
  status: string
  deadline: string
  sortBy: "score" | "value" | "brand" | "deadline" | "engagement"
  sortOrder: "asc" | "desc"
  tags: string[]
}

interface DealAnalytics {
  totalDeals: number
  avgMatchScore: number
  totalValue: string
  highValueDeals: number
  categoryDistribution: { [key: string]: number }
  scoreDistribution: { range: string; count: number }[]
}

export function DealEvaluationInterface({
  deals,
  selectedTalent,
  onViewDetails,
  onViewContact,
  onGenerateOutreach,
  onExportDeals,
  onStatusChange,
  onFindContact,
  findingContactForDealId,
  contactNotFoundDealIds,
}: DealEvaluationInterfaceProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState("deals")
  const [filters, setFilters] = useState<EvaluationFilters>({
    search: "",
    category: "all", // Updated default value to "all"
    valueRange: "any", // Updated default value to "any"
    minScore: 0,
    maxScore: 10,
    status: "any", // Updated default value to "any"
    deadline: "",
    sortBy: "score",
    sortOrder: "desc",
    tags: [],
  })

  // Calculate analytics
  const analytics: DealAnalytics = useMemo(() => {
    const totalDeals = deals.length
    const avgMatchScore = deals.length > 0 ? deals.reduce((sum, deal) => sum + deal.matchScore, 0) / deals.length : 0

    const totalValueNum = deals.reduce((sum, deal) => {
      const value = Number.parseInt(deal.valueRange.replace(/[^0-9]/g, "")) || 0
      return sum + value
    }, 0)

    const totalValue =
      totalValueNum >= 1000000 ? `$${(totalValueNum / 1000000).toFixed(1)}M` : `$${(totalValueNum / 1000).toFixed(0)}K`

    const highValueDeals = deals.filter((deal) => {
      const value = Number.parseInt(deal.valueRange.replace(/[^0-9]/g, "")) || 0
      return value >= 50000
    }).length

    const categoryDistribution = deals.reduce(
      (acc, deal) => {
        acc[deal.category] = (acc[deal.category] || 0) + 1
        return acc
      },
      {} as { [key: string]: number },
    )

    const scoreDistribution = [
      { range: "9-10", count: deals.filter((d) => d.matchScore >= 9).length },
      { range: "7-8.9", count: deals.filter((d) => d.matchScore >= 7 && d.matchScore < 9).length },
      { range: "5-6.9", count: deals.filter((d) => d.matchScore >= 5 && d.matchScore < 7).length },
      { range: "0-4.9", count: deals.filter((d) => d.matchScore < 5).length },
    ]

    return {
      totalDeals,
      avgMatchScore,
      totalValue,
      highValueDeals,
      categoryDistribution,
      scoreDistribution,
    }
  }, [deals])

  // Filter and sort deals
  const filteredDeals = useMemo(() => {
    let filtered = [...deals]

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (deal) =>
          deal.brand.toLowerCase().includes(searchLower) ||
          deal.title.toLowerCase().includes(searchLower) ||
          deal.description.toLowerCase().includes(searchLower) ||
          deal.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      )
    }

    if (filters.category !== "all") {
      filtered = filtered.filter((deal) => deal.category === filters.category)
    }

    if (filters.valueRange !== "any") {
      filtered = filtered.filter((deal) => {
        const dealValue = Number.parseInt(deal.valueRange.replace(/[^0-9]/g, "")) || 0
        switch (filters.valueRange) {
          case "0-25000":
            return dealValue <= 25000
          case "25000-50000":
            return dealValue > 25000 && dealValue <= 50000
          case "50000-100000":
            return dealValue > 50000 && dealValue <= 100000
          case "100000+":
            return dealValue > 100000
          default:
            return true
        }
      })
    }

    if (filters.status !== "any") {
      filtered = filtered.filter((deal) => deal.status === filters.status)
    }

    filtered = filtered.filter((deal) => deal.matchScore >= filters.minScore && deal.matchScore <= filters.maxScore)

    if (filters.tags.length > 0) {
      filtered = filtered.filter((deal) => filters.tags.some((tag) => deal.tags.includes(tag)))
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case "score":
          aValue = a.matchScore
          bValue = b.matchScore
          break
        case "value":
          aValue = Number.parseInt(a.valueRange.replace(/[^0-9]/g, "")) || 0
          bValue = Number.parseInt(b.valueRange.replace(/[^0-9]/g, "")) || 0
          break
        case "brand":
          aValue = a.brand
          bValue = b.brand
          break
        case "deadline":
          aValue = new Date(a.deadline || "2099-12-31")
          bValue = new Date(b.deadline || "2099-12-31")
          break
        case "engagement":
          aValue = a.engagement || 0
          bValue = b.engagement || 0
          break
        default:
          aValue = a.matchScore
          bValue = b.matchScore
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [deals, filters])

  const updateFilter = (key: keyof EvaluationFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "all", // Updated default value to "all"
      valueRange: "any", // Updated default value to "any"
      minScore: 0,
      maxScore: 10,
      status: "any", // Updated default value to "any"
      deadline: "",
      sortBy: "score",
      sortOrder: "desc",
      tags: [],
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-green-500"
    if (score >= 7) return "text-yellow-500"
    if (score >= 5) return "text-orange-500"
    return "text-red-500"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 9) return "default"
    if (score >= 7) return "secondary"
    return "outline"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
      case "potential":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "contacted":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "negotiating":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "closed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
      case "potential":
        return <Clock className="w-3 h-3" />
      case "contacted":
        return <Mail className="w-3 h-3" />
      case "negotiating":
        return <MessageCircle className="w-3 h-3" />
      case "closed":
        return <CheckCircle2 className="w-3 h-3" />
      case "rejected":
        return <XCircle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const statusOptions = [
    { value: "potential", label: "Potential" },
    { value: "contacted", label: "Contacted" },
    { value: "negotiating", label: "Negotiating" },
    { value: "closed", label: "Closed" },
    { value: "rejected", label: "Rejected" },
  ]

  const availableCategories = Array.from(new Set(deals.map((deal) => deal.category)))
  const availableTags = Array.from(new Set(deals.flatMap((deal) => deal.tags)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-center py-8 my-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Deal Evaluation</h2>
          <p className="text-muted-foreground">Analyze and evaluate discovered brand partnership opportunities</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mx-14">
          <TabsList>
            <TabsTrigger value="deals">Deals ({filteredDeals.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="filters">Advanced Filters</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>
            <Button onClick={() => onExportDeals(filteredDeals)} className="gap-2 pr-0 mr-2.5 text-secondary">
              <Download className="w-4 h-4" />
              Export ({filteredDeals.length})
            </Button>
          </div>
        </div>

        <TabsContent value="deals" className="space-y-4 mx-16">
          {/* Quick Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search deals, brands, descriptions..."
                    value={filters.search}
                    onChange={(e) => updateFilter("search", e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Match Score</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>

              <Button
                className="border border-primary-foreground bg-transparent"
                variant="outline"
                size="sm"
                onClick={() => updateFilter("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")}
              >
                {filters.sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>

              <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(filters.search ||
                filters.category !== "all" ||
                filters.valueRange !== "any" ||
                filters.minScore > 0) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>

          {/* Deals Grid/List */}
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {filteredDeals.map((deal) => (
              <Card key={deal.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{deal.brand}</h4>
                      <p className="text-xs text-muted-foreground">{deal.title}</p>
                    </div>
                    {/* Status Badge/Dropdown */}
                    {onStatusChange ? (
                      <Select
                        value={deal.status || "potential"}
                        onValueChange={(value) => onStatusChange(deal.id, value as Deal['status'])}
                      >
                        <SelectTrigger className={`w-32 h-7 text-xs ${getStatusColor(deal.status || "potential")}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(deal.status || "potential")}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(option.value)}
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={`text-xs ${getStatusColor(deal.status || "potential")}`}>
                        {getStatusIcon(deal.status || "potential")}
                        <span className="ml-1">{(deal.status || "potential").charAt(0).toUpperCase() + (deal.status || "potential").slice(1)}</span>
                      </Badge>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-foreground" />
                      <span style={{ color: "#AE94FB" }} className="font-semibold text-sm">
                        {deal.valueRange}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-green-500" />
                      <span style={{ color: "#AE94FB" }} className="font-semibold text-sm">
                        {deal.matchScore.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">/10</span>
                    </div>
                    {(deal as any).priority && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-blue-500" />
                        <span className="font-medium text-sm text-muted-foreground">
                          {(deal as any).priority}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2">{deal.description}</p>

                  {/* Website Link */}
                  {deal.website && (
                    <a
                      href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visit website
                    </a>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {deal.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs border-white">
                        {tag}
                      </Badge>
                    ))}
                    {deal.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs border-white">
                        +{deal.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Apollo Contact */}
                  {deal.apolloContact ? (
                    <div
                      className="bg-secondary/50 rounded-lg p-2 space-y-1 cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => (onViewContact || onViewDetails)(deal)}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-green-500" />
                          <span className="font-medium">{deal.apolloContact.name}</span>
                        </div>
                        {deal.apolloContact.confidence_score > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/10 text-green-500 border-green-500/30">
                            Score: {deal.apolloContact.confidence_score.toFixed(0)}
                          </Badge>
                        )}
                      </div>
                      {deal.apolloContact.title && (
                        <p className="text-xs text-muted-foreground pl-5">{deal.apolloContact.title}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pl-5">
                        {deal.apolloContact.email && (
                          <a href={`mailto:${deal.apolloContact.email}`} onClick={(e) => e.stopPropagation()} className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            Email
                          </a>
                        )}
                        {deal.apolloContact.phone && (
                          <a href={`tel:${deal.apolloContact.phone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {deal.apolloContact.phone}
                          </a>
                        )}
                        {deal.apolloContact.linkedin_url && (
                          <a href={deal.apolloContact.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                            <Linkedin className="w-3 h-3" />
                            LinkedIn
                          </a>
                        )}
                        {!deal.apolloContact.email && !deal.apolloContact.phone && !deal.apolloContact.linkedin_url && (
                          <span className="text-xs text-muted-foreground italic">Click for details</span>
                        )}
                      </div>
                    </div>
                  ) : onFindContact ? (
                    <div className="space-y-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onFindContact(deal)}
                        disabled={findingContactForDealId === deal.id}
                        className="w-full text-xs"
                      >
                        {findingContactForDealId === deal.id ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Finding contact...
                          </>
                        ) : (
                          <>
                            <UserSearch className="w-3 h-3 mr-2" />
                            {contactNotFoundDealIds?.has(deal.id) ? "Try again" : "Find partnership contact"}
                          </>
                        )}
                      </Button>
                      {contactNotFoundDealIds?.has(deal.id) && findingContactForDealId !== deal.id && (
                        <p className="text-xs text-muted-foreground text-center px-2">
                          No contact found for {deal.brand}. Try specifying a different role.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="flex gap-1 sm:gap-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(deal)}
                      className="flex-1 gap-1 text-xs lg:text-sm border-gray-400 text-white hover:bg-[#AE94FB] hover:text-black hover:border-[#AE94FB]"
                    >
                      <Eye className="w-3 h-3" />
                      <span className="hidden sm:inline">Details</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGenerateOutreach(deal)}
                      className="flex-1 gap-1 text-xs lg:text-sm border-gray-400 text-white hover:bg-[#AE94FB] hover:text-black hover:border-[#AE94FB]"
                    >
                      <Mail className="w-3 h-3" />
                      <span className="hidden sm:inline">Outreach</span>
                      <span className="sm:hidden">Send</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredDeals.length === 0 && (
            <Card className="p-8 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No deals match your current filters</p>
              <Button variant="outline" onClick={clearFilters} className="mt-2 bg-transparent">
                Clear Filters
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mx-16">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="font-bold text-primary text-3xl">{analytics.totalDeals}</div>
              <p className="text-sm text-muted-foreground">Total Deals</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="font-bold text-primary text-3xl">{analytics.avgMatchScore.toFixed(1)}</div>
              <p className="text-sm text-muted-foreground">Avg Match Score</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="font-bold text-3xl text-primary">{analytics.totalValue}</div>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="font-bold text-3xl text-primary">{analytics.highValueDeals}</div>
              <p className="text-sm text-muted-foreground">High Value ($50K+)</p>
            </Card>
          </div>

          {/* Score Distribution */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Match Score Distribution
            </h3>
            <div className="space-y-3">
              {analytics.scoreDistribution.map((item) => (
                <div key={item.range} className="flex items-center gap-3">
                  <div className="w-16 text-sm">{item.range}</div>
                  <div className="flex-1">
                    <Progress value={(item.count / analytics.totalDeals) * 100} className="h-2" />
                  </div>
                  <div className="w-12 text-sm text-right">{item.count}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Category Distribution */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Category Distribution</h3>
            <div className="space-y-2">
              {Object.entries(analytics.categoryDistribution).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm">{category}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <Card className="p-6 mx-16">
            <h3 className="font-semibold mb-4">Advanced Filtering Options</h3>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Value Range</label>
                  <Select value={filters.valueRange} onValueChange={(value) => updateFilter("valueRange", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Value" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Value</SelectItem>
                      <SelectItem value="0-25000">$0 - $25K</SelectItem>
                      <SelectItem value="25000-50000">$25K - $50K</SelectItem>
                      <SelectItem value="50000-100000">$50K - $100K</SelectItem>
                      <SelectItem value="100000+">$100K+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Deal Status</label>
                  <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="negotiating">Negotiating</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Match Score Range: {filters.minScore} - {filters.maxScore}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={filters.minScore}
                      onChange={(e) => updateFilter("minScore", Number.parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={filters.maxScore}
                      onChange={(e) => updateFilter("maxScore", Number.parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.slice(0, 8).map((tag) => (
                      <Button
                        key={tag}
                        variant={filters.tags.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newTags = filters.tags.includes(tag)
                            ? filters.tags.filter((t) => t !== tag)
                            : [...filters.tags, tag]
                          updateFilter("tags", newTags)
                        }}
                        className="text-xs"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={clearFilters}>
                Reset All Filters
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
