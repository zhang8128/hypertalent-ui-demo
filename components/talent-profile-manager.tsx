"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  User,
  Star,
  TrendingUp,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  DollarSign,
  Calendar,
  CheckCircle,
  Loader2,
  RefreshCw,
  X,
  Upload,
  Trash2,
} from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { apiClient } from "@/services/api-client"
import type { TalentProfile } from "@/types/talent"
import { uploadFileToS3, formatFileSize, getFileIcon } from "@/lib/s3-upload"

export type { TalentProfile }

export interface TalentDocument {
  id: string
  name: string
  size: number
  type: string
  url: string
  fileKey: string
  uploadedAt: string
  status?: "uploading" | "completed" | "error"
  progress?: number
  error?: string
}

interface TalentProfileManagerProps {
  selectedTalent?: TalentProfile
  onTalentChange: (talent: TalentProfile) => void
  entityFilter?: "talent" | "company"
}

export function TalentProfileManager({ selectedTalent, onTalentChange, entityFilter = "talent" }: TalentProfileManagerProps) {
  const [talents, setTalents] = useState<TalentProfile[]>([])
  const [documents, setDocuments] = useState<TalentDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, TalentDocument>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isCompany = entityFilter === "company"
  const entityLabel = isCompany ? "Company" : "Talent"

  const [newTalentForm, setNewTalentForm] = useState({
    name: "",
    category: "",
    bio: "",
    location: "",
    instagram: "",
    twitter: "",
    youtube: "",
    website: "",
  })

  // Filter talents strictly by entity type
  const filteredTalents = talents.filter(t =>
    t.type === entityFilter || (!t.type && entityFilter === "talent")
  )

  // Load talents on mount
  useEffect(() => {
    loadTalents()
  }, [])

  // Load documents when talent changes
  useEffect(() => {
    if (selectedTalent) {
      loadDocuments(selectedTalent.id)
    } else {
      setDocuments([])
    }
  }, [selectedTalent?.id])

  const loadTalents = async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.getTalents()
      setTalents(data.talents || [])
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const loadDocuments = async (talentId: string) => {
    try {
      const data = await apiClient.getTalentDocs(talentId)
      setDocuments(data.documents || [])
    } catch (error) {
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatCurrency = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`
    return `$${num}`
  }

  const handleTalentSelect = async (talentId: string) => {
    const talent = talents.find((t) => t.id === talentId)
    if (talent) {
      onTalentChange(talent)
    }
  }

  const handleCreateNew = async () => {
    if (!newTalentForm.name) return

    setIsCreating(true)
    try {
      const newTalent = await apiClient.createTalent({
        name: newTalentForm.name,
        category: newTalentForm.category || (isCompany ? "Technology" : "Creator"),
        type: entityFilter,
        bio: newTalentForm.bio || undefined,
        location: newTalentForm.location || undefined,
        socialMedia: {
          instagram: newTalentForm.instagram || undefined,
          twitter: newTalentForm.twitter || undefined,
          youtube: newTalentForm.youtube || undefined,
          website: newTalentForm.website || undefined,
        }
      })

      setTalents(prev => [...prev, newTalent])
      onTalentChange(newTalent)
      setShowCreateDialog(false)
      setNewTalentForm({
        name: "",
        category: "",
        bio: "",
        location: "",
        instagram: "",
        twitter: "",
        youtube: "",
        website: "",
      })
    } catch (error) {
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTalent = async (talentId: string) => {
    if (!confirm(`Are you sure you want to delete this ${entityLabel.toLowerCase()} and all their documents?`)) {
      return
    }

    try {
      await apiClient.deleteTalent(talentId)
      setTalents(prev => prev.filter(t => t.id !== talentId))
      if (selectedTalent?.id === talentId) {
        onTalentChange(undefined as any)
      }
    } catch (error) {
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (fileList: FileList) => {
    if (!selectedTalent) return

    const files = Array.from(fileList)

    for (const file of files) {
      const tempId = `temp-${Date.now()}-${Math.random()}`
      const tempDoc: TalentDocument = {
        id: tempId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: '',
        fileKey: '',
        uploadedAt: new Date().toISOString(),
        status: 'uploading',
        progress: 0
      }

      setUploadingFiles(prev => new Map(prev).set(tempId, tempDoc))

      try {
        const presignedData = await apiClient.getTalentDocUploadUrl(
          selectedTalent.id,
          file.name,
          file.type || 'application/octet-stream'
        )

        uploadFileToS3(presignedData, file, {
          onProgress: (progress) => {
            setUploadingFiles(prev => {
              const newMap = new Map(prev)
              const doc = newMap.get(tempId)
              if (doc) newMap.set(tempId, { ...doc, progress })
              return newMap
            })
          },
          onSuccess: (data) => {
            setUploadingFiles(prev => {
              const newMap = new Map(prev)
              newMap.delete(tempId)
              return newMap
            })
            const newDoc: TalentDocument = {
              id: data.file_id || tempId,
              name: file.name,
              size: file.size,
              type: file.type,
              url: data.public_url,
              fileKey: data.file_key,
              uploadedAt: new Date().toISOString(),
              status: 'completed'
            }
            setDocuments(prev => [...prev, newDoc])
          },
          onError: (error) => {
            setUploadingFiles(prev => {
              const newMap = new Map(prev)
              const doc = newMap.get(tempId)
              if (doc) {
                newMap.set(tempId, { ...doc, status: 'error', error: error.message })
              }
              return newMap
            })
          },
        })
      } catch (error) {
        setUploadingFiles(prev => {
          const newMap = new Map(prev)
          const doc = newMap.get(tempId)
          if (doc) {
            newMap.set(tempId, {
              ...doc,
              status: 'error',
              error: error instanceof Error ? error.message : 'Upload failed'
            })
          }
          return newMap
        })
      }
    }
  }

  const handleDeleteDocument = async (doc: TalentDocument) => {
    if (!selectedTalent) return

    try {
      await apiClient.deleteTalentDoc(selectedTalent.id, doc.fileKey)
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    } catch (error) {
    }
  }

  const allFiles = [
    ...documents.map(d => ({ ...d, status: 'completed' as const })),
    ...Array.from(uploadingFiles.values())
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{entityLabel} Profile</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadTalents} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                New {entityLabel}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New {entityLabel} Profile</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="social">{isCompany ? "Online Presence" : "Social Media"}</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">{isCompany ? "Company Name" : "Full Name"} *</Label>
                      <Input
                        id="name"
                        value={newTalentForm.name}
                        onChange={(e) => setNewTalentForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder={isCompany ? "Enter company name" : "Enter full name"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">{isCompany ? "Industry" : "Category"}</Label>
                      {isCompany ? (
                        <Select
                          value={newTalentForm.category}
                          onValueChange={(value) => setNewTalentForm((prev) => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="SaaS">SaaS</SelectItem>
                            <SelectItem value="E-commerce">E-commerce</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                            <SelectItem value="Media & Entertainment">Media & Entertainment</SelectItem>
                            <SelectItem value="Professional Services">Professional Services</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {["Professional Athlete", "Model", "Entertainer", "Lifestyle Influencer", "Gaming Creator", "Fashion Influencer", "Tech Reviewer", "Fitness Influencer", "Creator"].map((cat) => {
                            const selected = newTalentForm.category.split(", ").filter(Boolean).includes(cat)
                            return (
                              <Badge
                                key={cat}
                                variant={selected ? "default" : "outline"}
                                className={`cursor-pointer text-xs ${selected ? "" : "hover:bg-muted"}`}
                                onClick={() => {
                                  const current = newTalentForm.category.split(", ").filter(Boolean)
                                  const updated = selected
                                    ? current.filter((c) => c !== cat)
                                    : [...current, cat]
                                  setNewTalentForm((prev) => ({ ...prev, category: updated.join(", ") }))
                                }}
                              >
                                {cat}
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newTalentForm.location}
                      onChange={(e) => setNewTalentForm((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="City, State/Country"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={newTalentForm.bio}
                      onChange={(e) => setNewTalentForm((prev) => ({ ...prev, bio: e.target.value }))}
                      placeholder={isCompany ? "Brief description of the company..." : "Brief description of the talent..."}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="instagram">Instagram Handle</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                          <Instagram className="w-4 h-4" />
                        </div>
                        <Input
                          id="instagram"
                          value={newTalentForm.instagram}
                          onChange={(e) => setNewTalentForm((prev) => ({ ...prev, instagram: e.target.value }))}
                          placeholder="@username"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="twitter">Twitter Handle</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                          <Twitter className="w-4 h-4" />
                        </div>
                        <Input
                          id="twitter"
                          value={newTalentForm.twitter}
                          onChange={(e) => setNewTalentForm((prev) => ({ ...prev, twitter: e.target.value }))}
                          placeholder="@username"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="youtube">YouTube Channel</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                          <Youtube className="w-4 h-4" />
                        </div>
                        <Input
                          id="youtube"
                          value={newTalentForm.youtube}
                          onChange={(e) => setNewTalentForm((prev) => ({ ...prev, youtube: e.target.value }))}
                          placeholder="Channel name"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                          <Globe className="w-4 h-4" />
                        </div>
                        <Input
                          id="website"
                          value={newTalentForm.website}
                          onChange={(e) => setNewTalentForm((prev) => ({ ...prev, website: e.target.value }))}
                          placeholder="website.com"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNew} disabled={isCreating || !newTalentForm.name}>
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Profile"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Entity Selector */}
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filteredTalents.length === 0 ? (
        <Card className="p-6 text-center">
          <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No {entityLabel.toLowerCase()} profiles yet. Create one to get started.</p>
        </Card>
      ) : (
        <Select value={selectedTalent?.id} onValueChange={handleTalentSelect}>
          <SelectTrigger>
            <SelectValue placeholder={`Select a ${entityLabel.toLowerCase()} profile`} />
          </SelectTrigger>
          <SelectContent>
            {filteredTalents.map((talent) => (
              <SelectItem key={talent.id} value={talent.id}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {talent.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{talent.name}</div>
                    <div className="text-xs text-muted-foreground">{talent.category}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Selected Talent Profile */}
      {selectedTalent && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold">
                  {selectedTalent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-xl font-semibold">{selectedTalent.name}</h4>
                    <p className="text-muted-foreground">{selectedTalent.category}</p>
                    {selectedTalent.location && (
                      <p className="text-sm text-muted-foreground">{selectedTalent.location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {selectedTalent.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTalent(selectedTalent.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {selectedTalent.bio && <p className="text-sm text-muted-foreground mb-4">{selectedTalent.bio}</p>}

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <User className="w-4 h-4" />
                      <span className="font-semibold">{formatNumber(selectedTalent.stats?.followers || 0)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{isCompany ? "Employees" : "Followers"}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold">{selectedTalent.stats?.engagement || 0}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{isCompany ? "Growth" : "Engagement"}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-4 h-4" />
                      <span className="font-semibold">{selectedTalent.stats?.deals || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{isCompany ? "Partnerships" : "Deals"}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold">{formatCurrency(selectedTalent.stats?.avgDealValue || 0)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{isCompany ? "Avg Partnership" : "Avg Deal"}</p>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {selectedTalent.socialMedia?.instagram && (
                    <Badge variant="outline" className="gap-1">
                      <Instagram className="w-3 h-3" />
                      {selectedTalent.socialMedia.instagram}
                    </Badge>
                  )}
                  {selectedTalent.socialMedia?.twitter && (
                    <Badge variant="outline" className="gap-1">
                      <Twitter className="w-3 h-3" />
                      {selectedTalent.socialMedia.twitter}
                    </Badge>
                  )}
                  {selectedTalent.socialMedia?.youtube && (
                    <Badge variant="outline" className="gap-1">
                      <Youtube className="w-3 h-3" />
                      {selectedTalent.socialMedia.youtube}
                    </Badge>
                  )}
                </div>

                {/* Brand Alignment */}
                {selectedTalent.brandAlignment?.categories?.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">{isCompany ? "Partner Categories" : "Brand Categories"}</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedTalent.brandAlignment.categories.map((category) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Document Upload Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Documents & Media Kit</h5>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="w-3 h-3" />
                  {allFiles.length} files
                </Badge>
              </div>

              {/* Upload Zone */}
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center transition-colors border-border hover:border-primary/50 hover:bg-accent/5 cursor-pointer"
                onClick={handleFileSelect}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-foreground mb-2">
                  Click to upload files
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, Excel, images up to 50MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.doc,.docx"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* File List */}
              {allFiles.length > 0 && (
                <div className="space-y-2">
                  <h6 className="text-sm font-medium">Uploaded Files ({allFiles.length})</h6>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                        <div className="flex-shrink-0">{getFileIcon(file.type)}</div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-1">
                              {file.status === "completed" && <CheckCircle className="w-4 h-4 text-green-500" />}
                              {file.status === "error" && <X className="w-4 h-4 text-destructive" />}
                              <Badge variant="secondary" className="text-xs">
                                {formatFileSize(file.size)}
                              </Badge>
                            </div>
                          </div>

                          {file.status === "uploading" && (
                            <Progress value={file.progress || 0} className="h-1" />
                          )}

                          {file.error && <p className="text-xs text-destructive">{file.error}</p>}
                        </div>

                        {file.status === "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(file as TalentDocument)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
