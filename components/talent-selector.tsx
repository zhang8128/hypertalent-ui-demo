"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  User,
  Star,
  TrendingUp,
  Zap,
  Upload,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { useState, useCallback, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TalentProfileModal } from "./talent-profile-modal"
import { apiClient } from "@/services/api-client"
import type { TalentProfile, UploadedFile } from "@/types/talent"
import { ACCEPTED_TYPES, MAX_FILE_SIZE } from "@/lib/upload-constants"
import { uploadFileToS3, formatFileSize, getFileIcon } from "@/lib/s3-upload"

export type { TalentProfile, UploadedFile }

interface TalentSelectorProps {
  selectedTalent?: TalentProfile
  onTalentChange: (talent: TalentProfile) => void
  onCreateNew: () => void
  onStartDiscovery?: (prompt: string, searchDurationMinutes: number) => void
  isDiscovering?: boolean
  onFilesChange?: (files: UploadedFile[]) => void
  contextLabel?: string  // "Talent" or "Company" for B2B context
  defaultPrompt?: string  // Default prompt text for discovery
  entityFilter?: "talent" | "company"  // Filter to show only talents or companies (both always shown)
}

export function TalentSelector({
  selectedTalent,
  onTalentChange,
  onCreateNew,
  onStartDiscovery,
  isDiscovering,
  onFilesChange,
  contextLabel = "Talent",
  defaultPrompt = "Find brand partnership deals for this talent",
  entityFilter = "talent",
}: TalentSelectorProps) {
  const [talents, setTalents] = useState<TalentProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTalentName, setNewTalentName] = useState("")
  const [newTalentCategory, setNewTalentCategory] = useState("Creator")
  const [newEntityType, setNewEntityType] = useState<"talent" | "company">("talent")
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [discoveryPrompt, setDiscoveryPrompt] = useState("")
  const [searchDurationMinutes, setSearchDurationMinutes] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const originalFilesRef = useRef<Map<string, File>>(new Map())

  // Load talents from API on mount
  useEffect(() => {
    loadTalents()
  }, [])

  // Notify parent of file changes
  useEffect(() => {
    onFilesChange?.(files)
  }, [files, onFilesChange])

  const loadTalents = async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.getTalents()
      // Map API response to component interface
      const mappedTalents = (data.talents || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        avatar: t.avatar,
        stats: {
          followers: t.stats?.followers || 0,
          engagement: t.stats?.engagement || 0,
          deals: t.stats?.deals || 0,
        },
        status: t.status || 'active',
        type: t.type || 'talent',  // Default to talent for backwards compatibility
      }))
      setTalents(mappedTalents)
    } catch (error) {
      console.error('Failed to load talents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter talents strictly by entityFilter
  const filteredTalents = talents.filter(t =>
    t.type === entityFilter
  )

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const handleTalentSelect = (talentId: string) => {
    const talent = talents.find((t) => t.id === talentId)
    if (talent) {
      onTalentChange(talent)
      setFiles([]) // Clear files when switching talents
    }
  }

  const handleCreateNew = () => {
    setNewEntityType(entityFilter)  // Default to current context
    setShowCreateDialog(true)
  }

  const handleTalentDeleted = () => {
    // Refresh the list and clear selection
    loadTalents()
    onTalentChange(undefined as any)
    setFiles([])
  }

  const handleOpenProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectedTalent) {
      setShowProfileModal(true)
    }
  }

  const handleCreateTalent = async () => {
    if (!newTalentName.trim()) return

    setIsCreating(true)
    try {
      const newTalent = await apiClient.createTalent({
        name: newTalentName.trim(),
        category: newTalentCategory,
        type: newEntityType,
      })

      // Map to component interface
      const mappedTalent: TalentProfile = {
        id: newTalent.id,
        name: newTalent.name,
        category: newTalent.category,
        avatar: newTalent.avatar,
        stats: {
          followers: newTalent.stats?.followers || 0,
          engagement: newTalent.stats?.engagement || 0,
          deals: newTalent.stats?.deals || 0,
        },
        status: newTalent.status || 'active',
        type: newTalent.type || newEntityType,
      }
      setTalents(prev => [...prev, mappedTalent])
      onTalentChange(mappedTalent)
      setShowCreateDialog(false)
      setNewTalentName("")
      setNewTalentCategory("Creator")
      setNewEntityType(entityFilter)
    } catch (error) {
      console.error('Failed to create talent:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`
    }

    const acceptedTypes = Object.keys(ACCEPTED_TYPES)
    const isValidType = acceptedTypes.some((type) => {
      if (type.includes("*")) {
        return file.type.startsWith(type.split("*")[0])
      }
      return file.type === type
    })

    if (!isValidType) {
      return "File type not supported"
    }

    return null
  }

  const uploadToS3 = async (uploadFile: UploadedFile, originalFile: File): Promise<void> => {
    if (!selectedTalent) return

    try {
      const presignedData = await apiClient.getTalentDocUploadUrl(
        selectedTalent.id,
        uploadFile.name,
        uploadFile.type || 'application/octet-stream'
      )

      uploadFileToS3(presignedData, originalFile, {
        onProgress: (progress) => {
          setFiles(prev => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)))
        },
        onSuccess: (data) => {
          setFiles(prev =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "completed" as const, progress: 100, url: data.public_url, fileKey: data.file_key }
                : f,
            ),
          )
        },
        onError: (error) => {
          setFiles(prev =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "error" as const, error: error.message }
                : f,
            ),
          )
        },
      })
    } catch (error) {
      setFiles(prev =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "error" as const, error: error instanceof Error ? error.message : "Upload failed" }
            : f,
        ),
      )
    }
  }

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      if (!selectedTalent) return

      const newFiles: UploadedFile[] = []
      const fileArray = Array.from(fileList)

      fileArray.forEach((file) => {
        const error = validateFile(file)
        const fileId = `file-${Date.now()}-${Math.random()}`
        const uploadFile: UploadedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          status: error ? "error" : "uploading",
          progress: 0,
          error,
          talentId: selectedTalent?.id,
        }
        newFiles.push(uploadFile)
        if (!error) {
          originalFilesRef.current.set(fileId, file)
        }
      })

      setFiles(prev => [...prev, ...newFiles])

      // Start uploads for valid files
      for (const uploadFile of newFiles.filter((f) => !f.error)) {
        const originalFile = originalFilesRef.current.get(uploadFile.id)
        if (originalFile) {
          uploadToS3(uploadFile, originalFile).catch(console.error)
        }
      }
    },
    [selectedTalent],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles)
      }
    },
    [handleFiles],
  )

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files
      if (selectedFiles && selectedFiles.length > 0) {
        handleFiles(selectedFiles)
      }
      e.target.value = ""
    },
    [handleFiles],
  )

  const removeFile = useCallback(async (fileId: string) => {
    const file = files.find((f) => f.id === fileId)

    // If file was uploaded to S3, delete it
    if (file?.fileKey && file.status === "completed" && selectedTalent) {
      try {
        await apiClient.deleteTalentDoc(selectedTalent.id, file.fileKey)
      } catch (error) {
        console.error('Failed to delete file from S3:', error)
      }
    }

    setFiles((prev) => prev.filter((f) => f.id !== fileId))
    originalFilesRef.current.delete(fileId)
  }, [files, selectedTalent])

  const retryUpload = useCallback(
    (fileId: string) => {
      const file = files.find((f) => f.id === fileId)
      const originalFile = originalFilesRef.current.get(fileId)
      if (file && originalFile) {
        const updatedFile = { ...file, status: "uploading" as const, progress: 0, error: undefined }
        setFiles((prev) => prev.map((f) => (f.id === fileId ? updatedFile : f)))
        uploadToS3(updatedFile, originalFile).catch(console.error)
      }
    },
    [files],
  )

  const completedFiles = files.filter((f) => f.status === "completed")
  const hasProcessableFiles = completedFiles.length > 0

  return (
    <div className="space-y-4 py-[16] mx-4 px-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Selected {contextLabel}</h4>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadTalents}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateNew}
            disabled={isCreating}
            className="gap-1 bg-transparent border-primary"
          >
            <Plus className="w-3 h-3" />
            {isCreating ? "Creating..." : "New"}
          </Button>
        </div>
      </div>

      {/* Talent Selector Dropdown */}
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : filteredTalents.length === 0 ? (
        <Card className="p-4 text-center">
          <User className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No {contextLabel.toLowerCase()}s yet. Create one to get started.</p>
        </Card>
      ) : (
        <Select value={selectedTalent?.id} onValueChange={handleTalentSelect}>
          <SelectTrigger>
            <SelectValue placeholder={`Select a ${contextLabel.toLowerCase()} profile`} />
          </SelectTrigger>
          <SelectContent>
            {filteredTalents.map((talent) => (
              <SelectItem key={talent.id} value={talent.id}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                  <span>{talent.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {talent.category}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Selected Talent Card */}
      {selectedTalent && (
        <Card className="p-4 my-[16]">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors"
              onClick={handleOpenProfile}
            >
              <span className="text-sm font-medium">
                {selectedTalent.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleOpenProfile}
                  className="font-medium hover:underline text-left"
                >
                  {selectedTalent.name}
                </button>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="font-medium">{formatNumber(selectedTalent.stats?.followers || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-medium">{selectedTalent.stats?.engagement || 0}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span className="font-medium">{selectedTalent.stats?.deals || 0}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{selectedTalent.category}</p>
              <Button
                variant="link"
                size="sm"
                onClick={handleOpenProfile}
                className="h-auto p-0 text-xs text-primary"
              >
                View profile & manage documents
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {/* Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors border-foreground px-6 ${
                isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/5"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-foreground mb-2">
                Drag & drop files or{" "}
                <button onClick={handleFileSelect} className="text-primary hover:underline font-medium">
                  click to upload
                </button>
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, Excel, images, and videos up to {formatFileSize(MAX_FILE_SIZE)}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={Object.keys(ACCEPTED_TYPES).join(",")}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Uploaded Files ({files.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                      <div className="flex-shrink-0">{getFileIcon(file.type)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-1">
                            {file.status === "completed" && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {file.status === "error" && <AlertCircle className="w-4 h-4 text-destructive" />}
                            <Badge variant="secondary" className="text-xs">
                              {formatFileSize(file.size)}
                            </Badge>
                          </div>
                        </div>

                        {file.status === "uploading" && <Progress value={file.progress} className="h-1" />}

                        {file.error && <p className="text-xs text-destructive">{file.error}</p>}
                      </div>

                      <div className="flex items-center gap-1">
                        {file.status === "error" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryUpload(file.id)}
                            className="h-6 w-6 p-0"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {onStartDiscovery && (
            <div className="border-t mt-4 pt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="discovery-prompt" className="text-sm font-medium">
                  Discovery Prompt
                </Label>
                <Input
                  id="discovery-prompt"
                  placeholder={contextLabel === "Company" ? "e.g., Find strategic partners in the fintech space..." : "e.g., Find me some shoe brands to partner with..."}
                  value={discoveryPrompt}
                  onChange={(e) => setDiscoveryPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && discoveryPrompt.trim() && !isDiscovering) {
                      onStartDiscovery(discoveryPrompt, searchDurationMinutes)
                    }
                  }}
                  disabled={isDiscovering}
                />
                <p className="text-xs text-muted-foreground">
                  {contextLabel === "Company" ? "Describe what kind of strategic partnerships you're looking for" : "Describe what kind of brand partnerships you're looking for"}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="search-duration" className="text-sm font-medium">
                    Search Duration
                  </Label>
                  <span className="text-sm font-medium text-primary">
                    {searchDurationMinutes} {searchDurationMinutes === 1 ? 'minute' : 'minutes'}
                  </span>
                </div>
                <input
                  id="search-duration"
                  type="range"
                  min="1"
                  max="60"
                  value={searchDurationMinutes}
                  onChange={(e) => setSearchDurationMinutes(parseInt(e.target.value))}
                  disabled={isDiscovering}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 min (quick)</span>
                  <span>60 min (thorough)</span>
                </div>
              </div>
              <Button
                onClick={() => onStartDiscovery(discoveryPrompt || defaultPrompt, searchDurationMinutes)}
                disabled={isDiscovering}
                className="w-full gap-2 bg-[#AE94FB] hover:bg-[#9B7EF7] text-black font-medium"
                size="sm"
              >
                <Zap className="w-4 h-4" />
                {isDiscovering ? "Discovering..." : "Start Discovery"}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Create Talent Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New {contextLabel}</DialogTitle>
            <DialogDescription>
              Add a new {contextLabel.toLowerCase()} profile. You can add more details later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder={`Enter ${contextLabel.toLowerCase()} name`}
                value={newTalentName}
                onChange={(e) => setNewTalentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTalentName.trim()) {
                    handleCreateTalent()
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={newTalentCategory} onValueChange={setNewTalentCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {newEntityType === "company" ? (
                    <>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Creator">Creator</SelectItem>
                      <SelectItem value="Influencer">Influencer</SelectItem>
                      <SelectItem value="Athlete">Athlete</SelectItem>
                      <SelectItem value="Artist">Artist</SelectItem>
                      <SelectItem value="Musician">Musician</SelectItem>
                      <SelectItem value="Actor">Actor</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTalent} disabled={isCreating || !newTalentName.trim()}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Talent Profile Modal */}
      {selectedTalent && (
        <TalentProfileModal
          talent={selectedTalent}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onTalentDeleted={handleTalentDeleted}
        />
      )}
    </div>
  )
}
