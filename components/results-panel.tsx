"use client"
import { FileText, CheckCircle, History, Loader2, FolderOpen } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://qaqyqok7j0.execute-api.us-east-1.amazonaws.com'
import { FileUploadZone, type UploadedFile } from "./file-upload-zone"
import { TalentSelector, type TalentProfile } from "./talent-selector"
import type { DealFilters as DealFiltersType } from "./deal-filters"
import { DealDetailsModal } from "./deal-details-modal"
import { OutreachModal } from "./outreach-modal"
import { ExportModal } from "./export-modal"
import { DealEvaluationInterface } from "./deal-evaluation-interface"
import { AIDealDiscoveryEngine } from "./ai-deal-discovery-engine"
import { ChatResultsPanel } from "./tools/chat-results-panel"
import { CrawlerResultsPanel } from "./tools/crawler-results-panel"
import { GameplanResultsPanel } from "./tools/gameplan-results-panel"
import { SimulationResultsPanel } from "./tools/simulation-results-panel"
import type { Deal } from "@/types/deal"
import type { ToolType } from "@/app/page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SavedDealFile {
  filename: string
  file_key: string
  last_modified: string
  size: number
  prompt: string
  deal_count: number
}

const mockDeals: Deal[] = [
  {
    id: "deal-1",
    brand: "Nike",
    title: "Nike Partnership",
    category: "Athletic Apparel",
    valueRange: "$50K-100K",
    matchScore: 9.2,
    description: "High-value endorsement opportunity for athletic wear and footwear with global reach",
    tags: ["Sports", "Apparel", "Global"],
    deadline: "2025-03-15",
    requirements: ["Social media presence", "Athletic performance", "Brand alignment"],
    engagement: 4.8,
    reach: "2.5M",
    conversions: "3.2%",
    industry: "Sports & Recreation",
    companySize: "Large Enterprise",
    duration: "12 months",
    startDate: "2025-02-01",
    contact: {
      name: "Sarah Johnson",
      email: "partnerships@nike.com",
      department: "Global Partnerships",
    },
    status: "new",
    createdAt: "2025-01-15T10:30:00Z",
    updatedAt: "2025-01-15T10:30:00Z",
  },
  {
    id: "deal-2",
    brand: "Gatorade",
    title: "Sports Nutrition Campaign",
    category: "Sports Nutrition",
    valueRange: "$25K-50K",
    matchScore: 8.7,
    description: "Social media campaign for new product launch targeting athletic performance",
    tags: ["Nutrition", "Social Media", "Performance"],
    deadline: "2025-02-28",
    requirements: ["Athletic endorsement", "Social engagement", "Video content"],
    engagement: 5.2,
    reach: "1.8M",
    conversions: "4.1%",
    industry: "Food & Beverage",
    companySize: "Large Enterprise",
    duration: "6 months",
    startDate: "2025-01-20",
    contact: {
      name: "Mike Chen",
      email: "marketing@gatorade.com",
      department: "Brand Marketing",
    },
    status: "new",
    createdAt: "2025-01-15T10:31:00Z",
    updatedAt: "2025-01-15T10:31:00Z",
  },
  {
    id: "deal-3",
    brand: "Under Armour",
    title: "Training Gear Collaboration",
    category: "Athletic Apparel",
    valueRange: "$75K-150K",
    matchScore: 8.9,
    description: "Exclusive training gear line collaboration with performance testing and feedback",
    tags: ["Apparel", "Training", "Collaboration"],
    deadline: "2025-04-01",
    requirements: ["Product testing", "Feedback sessions", "Marketing content"],
    engagement: 4.5,
    reach: "3.1M",
    conversions: "2.8%",
    industry: "Sports & Recreation",
    companySize: "Large Enterprise",
    duration: "18 months",
    startDate: "2025-03-01",
    contact: {
      name: "Alex Rivera",
      email: "partnerships@underarmour.com",
      department: "Athlete Partnerships",
    },
    status: "new",
    createdAt: "2025-01-15T10:32:00Z",
    updatedAt: "2025-01-15T10:32:00Z",
  },
]

interface ResultsPanelProps {
  activeTool: ToolType
  sharedFiles?: UploadedFile[]
  onSharedFilesChange?: (files: UploadedFile[]) => void
  selectedTalent?: TalentProfile
  onTalentChange?: (talent: TalentProfile | undefined) => void
}

export function ResultsPanel({ activeTool, sharedFiles = [], onSharedFilesChange, selectedTalent: externalTalent, onTalentChange }: ResultsPanelProps) {
  const [localTalent, setLocalTalent] = useState<TalentProfile>()

  // Use external state if callback is provided, otherwise use local state
  const selectedTalent = onTalentChange ? externalTalent : localTalent
  const setSelectedTalent = onTalentChange || setLocalTalent
  const [files, setFiles] = useState<UploadedFile[]>(sharedFiles)
  const [deals, setDeals] = useState<Deal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [showDiscoveryEngine, setShowDiscoveryEngine] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showOutreachModal, setShowOutreachModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [savedDealFiles, setSavedDealFiles] = useState<SavedDealFile[]>([])
  const [isLoadingSavedDeals, setIsLoadingSavedDeals] = useState(false)
  const [selectedSavedFile, setSelectedSavedFile] = useState<string | null>(null)

  const [filters, setFilters] = useState<DealFiltersType>({
    search: "",
    category: "",
    valueRange: "",
    minScore: 0,
    sortBy: "score",
    sortOrder: "desc",
    tags: [],
  })
  const [discoveryPrompt, setDiscoveryPrompt] = useState("Find brand partnership deals for this talent")
  const [searchDurationMinutes, setSearchDurationMinutes] = useState(1)

  useEffect(() => {
    setFiles(sharedFiles)
  }, [sharedFiles])

  useEffect(() => {
    const savedFiles = localStorage.getItem("hyper-talent-files")
    if (savedFiles && sharedFiles.length === 0) {
      try {
        const parsedFiles = JSON.parse(savedFiles)
        setFiles(parsedFiles)
        if (onSharedFilesChange) {
          onSharedFilesChange(parsedFiles)
        }
      } catch (error) {
        console.error("Failed to load saved files:", error)
      }
    }
  }, [sharedFiles.length, onSharedFilesChange])

  useEffect(() => {
    localStorage.setItem("hyper-talent-files", JSON.stringify(files))
  }, [files])

  // Load saved deal files when talent changes
  useEffect(() => {
    if (selectedTalent) {
      loadSavedDealFiles(selectedTalent.id)
    } else {
      setSavedDealFiles([])
      setDeals([])
    }
  }, [selectedTalent])

  const loadSavedDealFiles = async (talentId: string) => {
    setIsLoadingSavedDeals(true)
    try {
      const response = await fetch(`${API_URL}/api/discovery/deals/${talentId}`)
      if (response.ok) {
        const data = await response.json()
        setSavedDealFiles(data.deal_files || [])

        // Auto-load the most recent deal file if available
        if (data.deal_files && data.deal_files.length > 0) {
          await loadDealFile(talentId, data.deal_files[0].filename)
        }
      }
    } catch (error) {
      console.error('Failed to load saved deal files:', error)
    } finally {
      setIsLoadingSavedDeals(false)
    }
  }

  const loadDealFile = async (talentId: string, filename: string) => {
    try {
      const response = await fetch(`${API_URL}/api/discovery/deals/${talentId}/${filename}`)
      if (response.ok) {
        const data = await response.json()
        // Convert API deals to frontend Deal format
        const loadedDeals: Deal[] = (data.deals || []).map((deal: any, index: number) => ({
          id: deal.id || `deal-${Date.now()}-${index}`,
          brand: deal.brand || 'Unknown Brand',
          title: deal.title || `Partnership with ${deal.brand}`,
          category: deal.category || 'General',
          valueRange: deal.value_range || '$25K-100K',
          matchScore: parseFloat(deal.match_score) || 7.0,
          description: deal.description || '',
          tags: [deal.category, deal.industry].filter(Boolean),
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          requirements: [],
          engagement: 4.0,
          reach: "500K",
          conversions: `${(parseFloat(deal.success_probability) * 100 || 70).toFixed(0)}%`,
          industry: deal.industry || 'General',
          companySize: "Enterprise",
          duration: "3-6 months",
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          contact: {
            name: `${deal.brand} Partnership Team`,
            email: `partnerships@${deal.brand?.toLowerCase().replace(/\\s+/g, '')}.com`,
            department: "Brand Partnerships",
          },
          status: deal.status || "new",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedValue: parseInt(deal.estimated_value) || 0,
          successProbability: parseFloat(deal.success_probability) || 0,
          priority: deal.priority || 'Medium',
          recommendedApproach: deal.recommended_approach || '',
        }))
        setDeals(loadedDeals)
        setSelectedSavedFile(filename)
        setShowDiscoveryEngine(false) // Hide discovery engine when loading saved deals
      }
    } catch (error) {
      console.error('Failed to load deal file:', error)
    }
  }

  const handleProcessFiles = async () => {
    if (!selectedTalent) {
      alert("Please select a talent profile first")
      return
    }

    setIsProcessing(true)
    setShowDiscoveryEngine(true)
    setIsDiscovering(true)
  }

  const handleDiscoveryComplete = useCallback(async (discoveredDeals: Deal[]) => {
    setDeals(discoveredDeals)
    setIsDiscovering(false)
    setIsProcessing(false)

    // Save deals as CSV to S3
    if (selectedTalent && discoveredDeals.length > 0) {
      try {
        const response = await fetch(`${API_URL}/api/discovery/save-deals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            talent_id: selectedTalent.id,
            talent_name: selectedTalent.name,
            prompt: discoveryPrompt,
            deals: discoveredDeals.map(deal => ({
              id: deal.id,
              brand: deal.brand,
              title: deal.title,
              category: deal.category,
              value_range: deal.valueRange,
              match_score: deal.matchScore,
              description: deal.description,
              industry: deal.industry,
              status: deal.status,
              priority: (deal as any).priority || 'Medium',
              estimated_value: (deal as any).estimatedValue || 0,
              success_probability: (deal as any).successProbability || 0,
              recommended_approach: (deal as any).recommendedApproach || '',
            }))
          })
        })

        if (response.ok) {
          const result = await response.json()
          console.log('Deals saved to S3:', result)
          // Reload saved deal files to show the new one
          await loadSavedDealFiles(selectedTalent.id)
          setSelectedSavedFile(result.filename)
        }
      } catch (error) {
        console.error('Failed to save deals to S3:', error)
      }
    }
  }, [selectedTalent, discoveryPrompt])

  const handleSessionComplete = (session: any) => {
    console.log("Discovery session completed:", session)
    setIsDiscovering(false)
  }

  const handleStartDiscovery = (prompt?: string, durationMinutes?: number) => {
    if (!selectedTalent) {
      alert("Please select a talent profile first")
      return
    }
    if (prompt) {
      setDiscoveryPrompt(prompt)
    }
    if (durationMinutes) {
      setSearchDurationMinutes(durationMinutes)
    }
    setSelectedSavedFile(null) // Clear selected saved file when starting new discovery
    setDeals([]) // Clear current deals
    setShowDiscoveryEngine(true)
    setIsDiscovering(true)
  }

  const availableCategories = Array.from(new Set(mockDeals.map((deal) => deal.category)))
  const availableTags = Array.from(new Set(mockDeals.flatMap((deal) => deal.tags)))

  const handleViewDetails = (deal: Deal) => {
    setSelectedDeal(deal)
    setShowDetailsModal(true)
  }

  const handleGenerateOutreach = (deal: Deal) => {
    setSelectedDeal(deal)
    setShowOutreachModal(true)
  }

  const handleExport = () => {
    setShowExportModal(true)
  }

  const handleFilesChange = (newFiles: UploadedFile[]) => {
    setFiles(newFiles)
    if (onSharedFilesChange) {
      onSharedFilesChange(newFiles)
    }
  }

  const getTerminalTitle = () => {
    switch (activeTool) {
      case "chat":
        return {
          title: "AI Assistant Terminal",
          subtitle: "Intelligent conversations and document generation",
        }
      case "crawler":
        return {
          title: "Market Intelligence Terminal",
          subtitle: "Real-time brand opportunity discovery",
        }
      case "gameplan":
        return {
          title: "Strategic Planning Terminal",
          subtitle: "Campaign strategy and execution planning",
        }
      case "simulation":
        return {
          title: "Deal Simulation Terminal",
          subtitle: "Model and predict partnership outcomes",
        }
      case "deal-hunter":
      default:
        return {
          title: "Deal Hunter Terminal",
          subtitle: "Find, negotiate, and close automatically",
        }
    }
  }

  const renderToolResults = () => {
    const commonProps = {
      selectedTalent,
      onTalentChange: setSelectedTalent,
      files,
      onFilesChange: handleFilesChange,
    }

    switch (activeTool) {
      case "chat":
        return <ChatResultsPanel {...commonProps} />
      case "crawler":
        return <CrawlerResultsPanel {...commonProps} />
      case "gameplan":
        return <GameplanResultsPanel {...commonProps} />
      case "simulation":
        return <SimulationResultsPanel {...commonProps} />
      case "deal-hunter":
      default:
        return (
          <>
            {/* Saved Deal Files Section */}
            {selectedTalent && savedDealFiles.length > 0 && !showDiscoveryEngine && (
              <div className="mx-10 mb-6">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      <h4 className="font-medium text-sm">Saved Discovery Sessions</h4>
                      <Badge variant="outline" className="text-xs">
                        {savedDealFiles.length} sessions
                      </Badge>
                    </div>
                    {isLoadingSavedDeals && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {savedDealFiles.map((file) => (
                      <div
                        key={file.filename}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedSavedFile === file.filename
                            ? 'bg-primary/20 border border-primary/40'
                            : 'bg-secondary/50 hover:bg-secondary'
                        }`}
                        onClick={() => selectedTalent && loadDealFile(selectedTalent.id, file.filename)}
                      >
                        <div className="flex items-center gap-3">
                          <FolderOpen className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {file.deal_count} deals
                              {selectedSavedFile === file.filename && (
                                <Badge className="ml-2 text-xs" variant="default">Active</Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {file.prompt || 'No prompt specified'}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(file.last_modified).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* No saved deals message */}
            {selectedTalent && savedDealFiles.length === 0 && !showDiscoveryEngine && !isLoadingSavedDeals && deals.length === 0 && (
              <div className="mx-10 mb-6">
                <Card className="p-6 text-center">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No saved deals for this talent yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the Discovery Prompt above to find brand partnership opportunities.
                  </p>
                </Card>
              </div>
            )}

            {showDiscoveryEngine && selectedTalent && (
              <div className="mx-10">
                <AIDealDiscoveryEngine
                  selectedTalent={selectedTalent}
                  query={discoveryPrompt}
                  searchDurationMinutes={searchDurationMinutes}
                  onDealsFound={handleDiscoveryComplete}
                  onSessionComplete={handleSessionComplete}
                />
              </div>
            )}

            {deals.length > 0 && (
              <DealEvaluationInterface
                deals={deals}
                selectedTalent={selectedTalent}
                onViewDetails={handleViewDetails}
                onGenerateOutreach={handleGenerateOutreach}
                onExportDeals={(dealsToExport) => {
                  setFilteredDeals(dealsToExport)
                  setShowExportModal(true)
                }}
              />
            )}
          </>
        )
    }
  }

  const renderToolSpecificPanel = () => {
    const completedFiles = files.filter((f) => f.status === "completed")

    if (activeTool === "deal-hunter") {
      return (
        <>
          <div className="bg-secondary/20 border border-border/50 rounded-lg p-8 border-none py-0">
            <div className="mb-6">
              <TalentSelector
                selectedTalent={selectedTalent}
                onTalentChange={setSelectedTalent}
                onCreateNew={() => console.log("Create new talent")}
                onStartDiscovery={handleStartDiscovery}
                isDiscovering={isDiscovering}
              />
            </div>

            
          </div>

          {/* Tool-Specific Results Section */}
          <div className="border-border border-t-[0] pt-[0]">{renderToolResults()}</div>
        </>
      )
    }

    return (
      <div className="space-y-6">
        {/* Talent Selector Section */}
        <div className="bg-secondary/20 border border-border/50 rounded-lg p-6">
          <TalentSelector
            selectedTalent={selectedTalent}
            onTalentChange={setSelectedTalent}
            onCreateNew={() => console.log("Create new talent")}
            onStartDiscovery={handleStartDiscovery}
            isDiscovering={isDiscovering}
          />
        </div>

        {/* File Upload Section */}
        <div className="bg-secondary/20 border border-border/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Context Files
              {completedFiles.length > 0 && (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {completedFiles.length} ready
                </Badge>
              )}
            </h4>
          </div>

          <FileUploadZone
            files={files}
            onFilesChange={handleFilesChange}
            onProcessFiles={handleProcessFiles}
            talentId={selectedTalent?.id}
          />

          {completedFiles.length > 0 && (
            <div className="mt-3 p-2 bg-green-500/5 border border-green-500/20 rounded text-xs text-green-700 dark:text-green-400">
              <p className="font-medium">✓ File Context Active</p>
              <p>AI will use uploaded files for personalized responses.</p>
            </div>
          )}
        </div>

        {/* Tool Results Section - Full width */}
        <div className="bg-secondary/20 border border-border/50 rounded-lg p-6">{renderToolResults()}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full items-stretch">
      {/* Header */}
      <div className="p-4 border-border bg-background border-none border-b-[0]">
        
      </div>

      <div className="flex-1 overflow-y-auto py-[16] space-y-4 text-foreground bg-background border-none rounded-none shadow-none mx-8 px-6">
        {renderToolSpecificPanel()}
      </div>

      {/* Modals */}
      <DealDetailsModal
        deal={selectedDeal}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onGenerateOutreach={handleGenerateOutreach}
      />

      <OutreachModal
        deal={selectedDeal}
        isOpen={showOutreachModal}
        onClose={() => setShowOutreachModal(false)}
        talentName={selectedTalent?.name}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        deals={filteredDeals}
        talent={selectedTalent}
        files={files}
      />
    </div>
  )
}
