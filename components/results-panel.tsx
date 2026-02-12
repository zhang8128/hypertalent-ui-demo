"use client"
import { FileText, CheckCircle, History, Loader2, FolderOpen, Trash2 } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"

import { apiClient, type TrackedDeal } from '@/services/api-client'
import { FileUploadZone } from "./file-upload-zone"
import { TalentSelector } from "./talent-selector"
import type { TalentProfile, UploadedFile } from "@/types/talent"
import type { DealFilters as DealFiltersType } from "./deal-filters"
import { DealDetailsModal } from "./deal-details-modal"
import { OutreachModal } from "./outreach-modal"
import { ExportModal } from "./export-modal"
import { DealEvaluationInterface } from "./deal-evaluation-interface"
import { AIDealDiscoveryEngine } from "./ai-deal-discovery-engine"
import { ChatResultsPanel } from "./tools/chat-results-panel"
import { CrawlerResultsPanel } from "./tools/crawler-results-panel"
// GameplanResultsPanel removed - now uses same flow as Deal Hunter with B2B context
import { SimulationResultsPanel } from "./tools/simulation-results-panel"
import type { Deal } from "@/types/deal"
import type { ToolType } from "@/app/page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SavedDealFile {
  filename: string
  file_key: string
  last_modified: string
  size: number
  prompt: string
  deal_count: number
}

interface ResultsPanelProps {
  activeTool: ToolType
  sharedFiles?: UploadedFile[]
  onSharedFilesChange?: (files: UploadedFile[]) => void
  selectedTalent?: TalentProfile
  onTalentChange?: (talent: TalentProfile | undefined) => void
}

export function ResultsPanel({ activeTool, sharedFiles = [], onSharedFilesChange, selectedTalent: externalTalent, onTalentChange }: ResultsPanelProps) {
  const [localTalent, setLocalTalent] = useState<TalentProfile>()
  const [chatEntityFilter, setChatEntityFilter] = useState<"talent" | "company">("talent")

  // Use external state if callback is provided, otherwise use local state
  const selectedTalent = onTalentChange ? externalTalent : localTalent
  const setSelectedTalent = onTalentChange || setLocalTalent
  const [files, setFiles] = useState<UploadedFile[]>(sharedFiles)
  const [deals, setDeals] = useState<Deal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const isDiscoveringRef = useRef(false)
  const [showDiscoveryEngine, setShowDiscoveryEngine] = useState(false)
  const [discoveryKey, setDiscoveryKey] = useState(0)
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
  const [findingContactForDealId, setFindingContactForDealId] = useState<string | undefined>()
  const [contactNotFoundDealIds, setContactNotFoundDealIds] = useState<Set<string>>(new Set())
  // Contact finder dialog state
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [contactDialogDeal, setContactDialogDeal] = useState<Deal | null>(null)
  const [rolePrompt, setRolePrompt] = useState("")
  const DEFAULT_ROLE_PROMPT = "VP of Marketing, Head of Partnerships, or Brand Manager"

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

  // Load saved deal files and persisted deals when talent changes
  useEffect(() => {
    if (selectedTalent) {
      loadSavedDealFiles(selectedTalent.id)
      loadPersistedDeals(selectedTalent.id)
    } else {
      setSavedDealFiles([])
      setDeals([])
    }
  }, [selectedTalent])

  // Load persisted deals from DynamoDB
  const loadPersistedDeals = async (talentId: string) => {
    try {
      const response = await apiClient.getTrackedDeals(talentId)
      if (response.deals && response.deals.length > 0) {
        const loadedDeals: Deal[] = response.deals.map((deal: TrackedDeal) => ({
          id: deal.deal_id,
          dealId: deal.deal_id,
          talentId: deal.talent_id,
          brand: deal.brand || 'Unknown Brand',
          title: `Partnership with ${deal.brand}`,
          category: deal.categories?.[0] || deal.industry || 'General',
          valueRange: deal.budget_range || '',
          matchScore: deal.match_score || 0,
          description: deal.match_reasons?.join('. ') || deal.recommended_approach || '',
          tags: [...(deal.categories || []), ...(deal.deal_types || [])],
          industry: deal.industry || 'General',
          website: deal.website || '',
          duration: deal.timeline || undefined,
          contact: deal.contact_info ? {
            name: deal.contact_info.name,
            email: deal.contact_info.email,
            department: deal.contact_info.title,
          } : undefined,
          apolloContact: deal.contact_info ? {
            id: deal.contact_info.apollo_id || '',
            name: deal.contact_info.name || '',
            title: deal.contact_info.title,
            email: deal.contact_info.email,
            phone: deal.contact_info.phone,
            linkedin_url: deal.contact_info.linkedin_url,
            confidence_score: parseFloat(deal.contact_info.confidence_score) || 0,
          } : undefined,
          status: deal.status === 'potential' ? 'new' : deal.status,
          createdAt: deal.created_at,
          updatedAt: deal.updated_at,
          estimatedValue: deal.estimated_value,
          successProbability: deal.success_probability,
          priority: deal.priority,
          recommendedApproach: deal.recommended_approach,
        }))
        setDeals(loadedDeals)
        // Only hide discovery engine if we're not actively discovering
        if (!isDiscoveringRef.current) {
          setShowDiscoveryEngine(false)
        }
      }
    } catch (error) {
      console.error('Failed to load persisted deals:', error)
    }
  }

  // Handle status change from UI
  const handleStatusChange = async (dealId: string, newStatus: Deal['status']) => {
    if (!selectedTalent) return

    // Optimistic update
    setDeals(prevDeals => prevDeals.map(deal =>
      deal.id === dealId || deal.dealId === dealId
        ? { ...deal, status: newStatus }
        : deal
    ))

    try {
      // Map frontend status to backend status
      const backendStatus = newStatus === 'new' ? 'potential' : newStatus
      await apiClient.updateDealStatus(selectedTalent.id, dealId, backendStatus as any)
    } catch (error) {
      console.error('Failed to update deal status:', error)
      // Revert on error - reload from server
      loadPersistedDeals(selectedTalent.id)
    }
  }

  // Show dialog to optionally enter role prompt before finding contact
  const handleFindContact = async (deal: Deal) => {
    if (!selectedTalent) return
    setContactDialogDeal(deal)
    setRolePrompt("") // Clear any previous prompt, will use default if empty
    setShowContactDialog(true)
  }

  // Execute the actual contact search after dialog confirmation
  const executeContactSearch = async () => {
    if (!selectedTalent || !contactDialogDeal) return

    const deal = contactDialogDeal
    const dealId = deal.dealId || deal.id

    setShowContactDialog(false)
    setFindingContactForDealId(deal.id)

    try {
      // Use custom role prompt if provided, otherwise pass undefined to use backend defaults
      const finalRolePrompt = rolePrompt.trim() || undefined

      const result = await apiClient.findAndSaveContact(
        selectedTalent.id,
        dealId,
        deal.brand,
        deal.website || undefined,
        finalRolePrompt
      )

      if (result.success && result.contact) {
        // Update local state with the contact info
        setDeals(prevDeals => prevDeals.map(d =>
          (d.id === deal.id || d.dealId === dealId)
            ? {
                ...d,
                apolloContact: {
                  id: result.contact!.id,
                  name: result.contact!.name,
                  title: result.contact!.title,
                  email: result.contact!.email,
                  phone: result.contact!.phone,
                  linkedin_url: result.contact!.linkedin_url,
                  confidence_score: result.contact!.confidence_score,
                }
              }
            : d
        ))
        // Clear any previous "not found" state for this deal
        setContactNotFoundDealIds(prev => {
          const next = new Set(prev)
          next.delete(deal.id)
          return next
        })
      } else {
        // No contact found — mark this deal so the UI shows a message
        setContactNotFoundDealIds(prev => new Set(prev).add(deal.id))
      }
    } catch (error) {
      console.error('Failed to find contact:', error)
      // Show error state on the deal card
      setContactNotFoundDealIds(prev => new Set(prev).add(deal.id))
    } finally {
      setFindingContactForDealId(undefined)
      setContactDialogDeal(null)
    }
  }

  const loadSavedDealFiles = async (talentId: string) => {
    setIsLoadingSavedDeals(true)
    try {
      const data = await apiClient.getSavedDealFiles(talentId)
      setSavedDealFiles(data.deal_files || [])

      // Auto-load the most recent deal file if available
      if (data.deal_files && data.deal_files.length > 0) {
        await loadDealFile(talentId, data.deal_files[0].filename)
      }
    } catch (error) {
      console.error('Failed to load saved deal files:', error)
    } finally {
      setIsLoadingSavedDeals(false)
    }
  }

  const loadDealFile = async (talentId: string, filename: string) => {
    try {
      const [data, trackedResponse] = await Promise.all([
        apiClient.loadDealFile(talentId, filename),
        apiClient.getTrackedDeals(talentId).catch(() => ({ deals: [] as TrackedDeal[] })),
      ])

      // Build lookups from tracked deals (DynamoDB has richer data than CSV)
      const trackedByBrand = new Map<string, TrackedDeal>()
      for (const td of (trackedResponse.deals || [])) {
        if (td.brand) {
          trackedByBrand.set(td.brand, td)
        }
      }

      // Convert API deals to frontend Deal format, enriching with DynamoDB data
      const loadedDeals: Deal[] = (data.deals || []).map((deal: any, index: number) => {
        const tracked = trackedByBrand.get(deal.brand || '')
        return {
          id: deal.id || `deal-${Date.now()}-${index}`,
          dealId: tracked?.deal_id,
          talentId: tracked?.talent_id,
          brand: deal.brand || 'Unknown Brand',
          title: deal.title || `Partnership with ${deal.brand}`,
          category: deal.category || 'General',
          valueRange: deal.value_range || '',
          matchScore: parseFloat(deal.match_score) || 0,
          description: deal.description || '',
          tags: [deal.category, deal.industry].filter(Boolean),
          industry: deal.industry || 'General',
          website: deal.website || tracked?.website || '',
          status: deal.status || "new",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedValue: parseInt(deal.estimated_value) || 0,
          successProbability: parseFloat(deal.success_probability) || 0,
          priority: deal.priority || 'Medium',
          recommendedApproach: deal.recommended_approach || '',
          contact: tracked?.contact_info ? {
            name: tracked.contact_info.name,
            email: tracked.contact_info.email,
            department: tracked.contact_info.title,
          } : undefined,
          apolloContact: tracked?.contact_info ? {
            id: tracked.contact_info.apollo_id || '',
            name: tracked.contact_info.name || '',
            title: tracked.contact_info.title,
            email: tracked.contact_info.email,
            phone: tracked.contact_info.phone,
            linkedin_url: tracked.contact_info.linkedin_url,
            confidence_score: parseFloat(tracked.contact_info.confidence_score) || 0,
          } : undefined,
        }
      })
      setDeals(loadedDeals)
      setSelectedSavedFile(filename)
      // Only hide discovery engine if we're not actively discovering
      if (!isDiscoveringRef.current) {
        setShowDiscoveryEngine(false)
      }
    } catch (error) {
      console.error('Failed to load deal file:', error)
    }
  }

  const handleDeleteSession = async (e: React.MouseEvent, file: SavedDealFile) => {
    e.stopPropagation() // Don't trigger the card click (load)
    if (!selectedTalent) return

    try {
      await apiClient.deleteDealFile(selectedTalent.id, file.filename)
      setSavedDealFiles(prev => prev.filter(f => f.filename !== file.filename))

      // If the deleted file was currently active, clear deals
      if (selectedSavedFile === file.filename) {
        setSelectedSavedFile(null)
        setDeals([])
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const handleProcessFiles = async () => {
    if (!selectedTalent) {
      alert("Please select a talent profile first")
      return
    }

    setIsProcessing(true)
    setDiscoveryKey(k => k + 1) // Force remount
    setShowDiscoveryEngine(true)
    isDiscoveringRef.current = true
    setIsDiscovering(true)
  }

  // Handle a single deal arriving from the stream
  const handleDealFound = useCallback((deal: Deal) => {
    setDeals(prev => [...prev, deal])
  }, [])

  const handleDiscoveryComplete = useCallback(async (discoveredDeals: Deal[]) => {
    // Don't setDeals here — state is already populated incrementally via handleDealFound.
    // discoveredDeals is the final list used only for persistence below.
    isDiscoveringRef.current = false
    setIsDiscovering(false)
    setIsProcessing(false)

    if (!selectedTalent || discoveredDeals.length === 0) return

    // Persist to DynamoDB first to get deal_ids
    let dealIds: string[] = []
    try {
      const persistResult = await apiClient.persistDeals(
        selectedTalent.id,
        discoveredDeals.map(deal => ({
          id: deal.id,
          brand: deal.brand,
          industry: deal.industry,
          match_score: deal.matchScore,
          deal_types: deal.tags?.filter(t => ['Sponsorship', 'Endorsement', 'Campaign', 'Brand Ambassador', 'Content Creation', 'Product Placement', 'Channel Partnership', 'Co-marketing', 'Technology Integration', 'Distribution Agreement', 'Joint Venture', 'OEM/Reseller'].includes(t)) || [],
          budget_range: deal.valueRange,
          categories: deal.tags?.slice(0, 5) || [],
          match_reasons: deal.description ? [deal.description.split('.')[0]] : [],
          website: deal.website || '',
          recommended_approach: (deal as any).recommendedApproach || '',
          estimated_value: (deal as any).estimatedValue || 0,
          success_probability: (deal as any).successProbability || 0,
          priority: (deal as any).priority || 'Medium',
          timeline: deal.duration || '4-8 weeks',
        }))
      )
      dealIds = persistResult.deal_ids || []
    } catch (persistError) {
      console.error('Failed to persist deals:', persistError)
    }

    // Update deals with persisted IDs
    if (dealIds.length > 0) {
      setDeals(prev => prev.map((deal, index) => ({
        ...deal,
        id: dealIds[index] || deal.id,
        dealId: dealIds[index] || deal.id,
        talentId: selectedTalent.id,
      })))
    }

    // Save deals as CSV to S3
    try {
      const result = await apiClient.saveDeals(
        selectedTalent.id,
        selectedTalent.name,
        discoveryPrompt,
        discoveredDeals.map(deal => ({
          id: deal.id,
          brand: deal.brand,
          title: deal.title,
          category: deal.category,
          value_range: deal.valueRange,
          match_score: deal.matchScore,
          description: deal.description,
          industry: deal.industry,
          website: deal.website || '',
          status: deal.status,
          priority: (deal as any).priority || 'Medium',
          estimated_value: (deal as any).estimatedValue || 0,
          success_probability: (deal as any).successProbability || 0,
          recommended_approach: (deal as any).recommendedApproach || '',
        }))
      )
      // Reload the saved files list (but don't auto-load — we already have deals in state)
      const data = await apiClient.getSavedDealFiles(selectedTalent.id)
      setSavedDealFiles(data.deal_files || [])
      setSelectedSavedFile(result.filename)
    } catch (error) {
      console.error('Failed to save deals to S3:', error)
    }
  }, [selectedTalent, discoveryPrompt])

  const handleSessionComplete = (_session: any) => {
    isDiscoveringRef.current = false
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
    setDiscoveryKey(k => k + 1) // Force remount of discovery engine (resets hasStartedRef)
    setShowDiscoveryEngine(true)
    isDiscoveringRef.current = true
    setIsDiscovering(true)
  }

  const availableCategories = Array.from(new Set(deals.map((deal) => deal.category)))
  const availableTags = Array.from(new Set(deals.flatMap((deal) => deal.tags)))

  const [detailsInitialTab, setDetailsInitialTab] = useState("overview")

  const handleViewDetails = (deal: Deal) => {
    setSelectedDeal(deal)
    setDetailsInitialTab("overview")
    setShowDetailsModal(true)
  }

  const handleViewContact = (deal: Deal) => {
    setSelectedDeal(deal)
    setDetailsInitialTab("contact")
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
      case "gameplanx":
        return {
          title: "B2B Partner Discovery Terminal",
          subtitle: "Find and evaluate strategic partnership opportunities",
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
        return (
          <ChatResultsPanel
            {...commonProps}
            entityFilter={chatEntityFilter}
            onEntityFilterChange={setChatEntityFilter}
            deals={deals}
          />
        )
      case "crawler":
        return <CrawlerResultsPanel {...commonProps} />
      case "simulation":
        return <SimulationResultsPanel {...commonProps} />
      case "gameplanx":
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
                      <h4 className="font-medium text-sm">{contextLabels.sessionLabel}</h4>
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(file.last_modified).toLocaleDateString()}
                          </span>
                          <button
                            onClick={(e) => handleDeleteSession(e, file)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
                  key={discoveryKey}
                  selectedTalent={selectedTalent}
                  query={discoveryPrompt}
                  searchDurationMinutes={searchDurationMinutes}
                  entityType={contextLabels.entityFilter}
                  onDealFound={handleDealFound}
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
                onViewContact={handleViewContact}
                onGenerateOutreach={handleGenerateOutreach}
                onExportDeals={(dealsToExport) => {
                  setFilteredDeals(dealsToExport)
                  setShowExportModal(true)
                }}
                onStatusChange={handleStatusChange}
                onFindContact={handleFindContact}
                findingContactForDealId={findingContactForDealId}
                contactNotFoundDealIds={contactNotFoundDealIds}
              />
            )}
          </>
        )
    }
  }

  // Get context labels based on tool type
  const getContextLabels = () => {
    if (activeTool === "gameplanx") {
      return {
        entityType: "Company",
        entityTypePlural: "Companies",
        entityFilter: "company" as const,
        searchLabel: "Find B2B Partners",
        defaultPrompt: "Find strategic B2B partners for this company",
        resultLabel: "Partnership Opportunities",
        sessionLabel: "Saved Partnership Sessions",
      }
    }
    if (activeTool === "chat") {
      const isCompany = chatEntityFilter === "company"
      return {
        entityType: isCompany ? "Company" : "Talent",
        entityTypePlural: isCompany ? "Companies" : "Talents",
        entityFilter: chatEntityFilter,
        searchLabel: isCompany ? "Find B2B Partners" : "Find Brand Deals",
        defaultPrompt: isCompany
          ? "Find strategic B2B partners for this company"
          : "Find brand partnership deals for this talent",
        resultLabel: isCompany ? "Partnership Opportunities" : "Deal Opportunities",
        sessionLabel: isCompany ? "Saved Partnership Sessions" : "Saved Discovery Sessions",
      }
    }
    return {
      entityType: "Talent",
      entityTypePlural: "Talents",
      entityFilter: "talent" as const,
      searchLabel: "Find Brand Deals",
      defaultPrompt: "Find brand partnership deals for this talent",
      resultLabel: "Deal Opportunities",
      sessionLabel: "Saved Discovery Sessions",
    }
  }

  const contextLabels = getContextLabels()

  const renderToolSpecificPanel = () => {
    const completedFiles = files.filter((f) => f.status === "completed")

    if (activeTool === "deal-hunter" || activeTool === "gameplanx") {
      return (
        <>
          <div className="bg-secondary/20 border border-border/50 rounded-lg p-8 border-none py-0">
            <div className="mb-6">
              <TalentSelector
                selectedTalent={selectedTalent}
                onTalentChange={setSelectedTalent}
                onCreateNew={() => {}}
                onStartDiscovery={handleStartDiscovery}
                isDiscovering={isDiscovering}
                contextLabel={contextLabels.entityType}
                defaultPrompt={contextLabels.defaultPrompt}
                entityFilter={contextLabels.entityFilter}
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
            onCreateNew={() => {}}
            onStartDiscovery={handleStartDiscovery}
            isDiscovering={isDiscovering}
            contextLabel={contextLabels.entityType}
            defaultPrompt={contextLabels.defaultPrompt}
            entityFilter={contextLabels.entityFilter}
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
        initialTab={detailsInitialTab}
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

      {/* Contact Finder Dialog with optional role prompt */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Find Partnership Contact</DialogTitle>
            <DialogDescription>
              Search for the best contact at <span className="font-semibold">{contactDialogDeal?.brand}</span> for partnership outreach.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rolePrompt">Role/Position (optional)</Label>
              <Input
                id="rolePrompt"
                placeholder={DEFAULT_ROLE_PROMPT}
                value={rolePrompt}
                onChange={(e) => setRolePrompt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default search, or specify a role like "Chief Brand Ambassador" or "Media Manager for women's sportswear division"
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeContactSearch}>
              Find Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
