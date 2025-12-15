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
  FileText,
  ImageIcon,
  FileSpreadsheet,
  Upload,
  Trash2,
} from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://qaqyqok7j0.execute-api.us-east-1.amazonaws.com'

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

export interface TalentProfile {
  id: string
  name: string
  category: string
  avatar?: string
  bio?: string
  location?: string
  stats: {
    followers: number
    engagement: number
    deals: number
    avgDealValue: number
  }
  socialMedia: {
    instagram?: string
    twitter?: string
    youtube?: string
    tiktok?: string
    website?: string
  }
  demographics: {
    ageRange: string
    topLocations: string[]
    interests: string[]
  }
  brandAlignment: {
    categories: string[]
    values: string[]
    pastBrands: string[]
  }
  goals: {
    targetDeals: number
    preferredCategories: string[]
    minDealValue: number
  }
  status: string
  createdAt: string
  updatedAt: string
}

interface TalentProfileManagerProps {
  selectedTalent?: TalentProfile
  onTalentChange: (talent: TalentProfile) => void
}

export function TalentProfileManager({ selectedTalent, onTalentChange }: TalentProfileManagerProps) {
  const [talents, setTalents] = useState<TalentProfile[]>([])
  const [documents, setDocuments] = useState<TalentDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, TalentDocument>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const response = await fetch(`${API_URL}/api/talents`)
      if (response.ok) {
        const data = await response.json()
        setTalents(data.talents || [])
      }
    } catch (error) {
      console.error('Failed to load talents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDocuments = async (talentId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/talents/${talentId}/docs`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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
      const response = await fetch(`${API_URL}/api/talents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTalentForm.name,
          category: newTalentForm.category || "Creator",
          bio: newTalentForm.bio || undefined,
          location: newTalentForm.location || undefined,
          socialMedia: {
            instagram: newTalentForm.instagram || undefined,
            twitter: newTalentForm.twitter || undefined,
            youtube: newTalentForm.youtube || undefined,
            website: newTalentForm.website || undefined,
          }
        })
      })

      if (response.ok) {
        const newTalent = await response.json()
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
      } else {
        console.error('Failed to create talent')
      }
    } catch (error) {
      console.error('Failed to create talent:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTalent = async (talentId: string) => {
    if (!confirm('Are you sure you want to delete this talent and all their documents?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/talents/${talentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTalents(prev => prev.filter(t => t.id !== talentId))
        if (selectedTalent?.id === talentId) {
          onTalentChange(undefined as any)
        }
      }
    } catch (error) {
      console.error('Failed to delete talent:', error)
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
        // 1. Get presigned URL
        const presignedResponse = await fetch(`${API_URL}/api/talents/${selectedTalent.id}/docs/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            content_type: file.type || 'application/octet-stream'
          })
        })

        if (!presignedResponse.ok) {
          throw new Error('Failed to get upload URL')
        }

        const presignedData = await presignedResponse.json()

        // 2. Upload to S3
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100
              setUploadingFiles(prev => {
                const newMap = new Map(prev)
                const doc = newMap.get(tempId)
                if (doc) {
                  newMap.set(tempId, { ...doc, progress })
                }
                return newMap
              })
            }
          })

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          })

          xhr.addEventListener('error', () => reject(new Error('Upload failed')))

          const formData = new FormData()
          Object.entries(presignedData.fields).forEach(([key, value]) => {
            formData.append(key, value as string)
          })
          formData.append('file', file)

          xhr.open('POST', presignedData.upload_url)
          xhr.send(formData)
        })

        // 3. Remove from uploading, add to documents
        setUploadingFiles(prev => {
          const newMap = new Map(prev)
          newMap.delete(tempId)
          return newMap
        })

        const newDoc: TalentDocument = {
          id: presignedData.file_id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: presignedData.public_url,
          fileKey: presignedData.file_key,
          uploadedAt: new Date().toISOString(),
          status: 'completed'
        }

        setDocuments(prev => [...prev, newDoc])

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
      const response = await fetch(`${API_URL}/api/talents/${selectedTalent.id}/docs/${encodeURIComponent(doc.fileKey)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== doc.id))
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="w-4 h-4" />
    if (type.includes("sheet") || type.includes("excel")) return <FileSpreadsheet className="w-4 h-4" />
    if (type.includes("image")) return <ImageIcon className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const allFiles = [
    ...documents.map(d => ({ ...d, status: 'completed' as const })),
    ...Array.from(uploadingFiles.values())
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Talent Profile</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={loadTalents} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                New Talent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Talent Profile</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="social">Social Media</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newTalentForm.name}
                        onChange={(e) => setNewTalentForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newTalentForm.category}
                        onValueChange={(value) => setNewTalentForm((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Professional Athlete">Professional Athlete</SelectItem>
                          <SelectItem value="Lifestyle Influencer">Lifestyle Influencer</SelectItem>
                          <SelectItem value="Gaming Creator">Gaming Creator</SelectItem>
                          <SelectItem value="Fashion Influencer">Fashion Influencer</SelectItem>
                          <SelectItem value="Tech Reviewer">Tech Reviewer</SelectItem>
                          <SelectItem value="Fitness Influencer">Fitness Influencer</SelectItem>
                          <SelectItem value="Creator">Creator</SelectItem>
                        </SelectContent>
                      </Select>
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
                      placeholder="Brief description of the talent..."
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

      {/* Talent Selector */}
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : talents.length === 0 ? (
        <Card className="p-6 text-center">
          <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No talent profiles yet. Create one to get started.</p>
        </Card>
      ) : (
        <Select value={selectedTalent?.id} onValueChange={handleTalentSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a talent profile" />
          </SelectTrigger>
          <SelectContent>
            {talents.map((talent) => (
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
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold">{selectedTalent.stats?.engagement || 0}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-4 h-4" />
                      <span className="font-semibold">{selectedTalent.stats?.deals || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Deals</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold">{formatCurrency(selectedTalent.stats?.avgDealValue || 0)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Deal</p>
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
                    <h5 className="text-sm font-medium">Brand Categories</h5>
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
