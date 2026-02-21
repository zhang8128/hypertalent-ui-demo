"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  User,
  Star,
  TrendingUp,
  Upload,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  ExternalLink,
  Pencil,
  Save,
  FileText,
} from "lucide-react"
import { useState, useCallback, useRef, useEffect } from "react"
import type { TalentProfile, UploadedFile, TalentDocument } from "@/types/talent"
import { apiClient } from "@/services/api-client"
import { ACCEPTED_TYPES, MAX_FILE_SIZE } from "@/lib/upload-constants"
import { uploadFileToS3, formatFileSize, getFileIcon } from "@/lib/s3-upload"

interface TalentProfileModalProps {
  talent: TalentProfile
  isOpen: boolean
  onClose: () => void
  onTalentDeleted: () => void
  onTalentUpdated?: (talent: TalentProfile) => void
}

export function TalentProfileModal({
  talent,
  isOpen,
  onClose,
  onTalentDeleted,
  onTalentUpdated,
}: TalentProfileModalProps) {
  const [documents, setDocuments] = useState<TalentDocument[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [fullProfile, setFullProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState<Record<string, any>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const originalFilesRef = useRef<Map<string, File>>(new Map())

  // Load documents and full profile when modal opens
  useEffect(() => {
    if (isOpen && talent?.id) {
      loadDocuments()
      loadFullProfile()
    }
  }, [isOpen, talent?.id])

  const loadDocuments = async () => {
    if (!talent?.id) return
    setIsLoadingDocs(true)
    try {
      const data = await apiClient.getTalentDocs(talent.id)
      setDocuments(data.documents || [])
    } catch (error) {
    } finally {
      setIsLoadingDocs(false)
    }
  }

  const loadFullProfile = async () => {
    if (!talent?.id) return
    try {
      const data = await apiClient.getTalent(talent.id)
      setFullProfile(data)
    } catch (error) {
    }
  }

  const startEditing = () => {
    setEditData({
      name: fullProfile?.name || talent.name,
      category: fullProfile?.category || talent.category,
      bio: fullProfile?.bio || "",
      location: fullProfile?.location || "",
      status: fullProfile?.status || talent.status,
      stats: {
        followers: fullProfile?.stats?.followers ?? talent.stats?.followers ?? 0,
        engagement: fullProfile?.stats?.engagement ?? talent.stats?.engagement ?? 0,
        deals: fullProfile?.stats?.deals ?? talent.stats?.deals ?? 0,
        avgDealValue: fullProfile?.stats?.avgDealValue ?? talent.stats?.avgDealValue ?? 0,
      },
      socialMedia: {
        instagram: fullProfile?.socialMedia?.instagram || "",
        twitter: fullProfile?.socialMedia?.twitter || "",
        youtube: fullProfile?.socialMedia?.youtube || "",
        tiktok: fullProfile?.socialMedia?.tiktok || "",
        website: fullProfile?.socialMedia?.website || "",
      },
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditData({})
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated = await apiClient.updateTalent(talent.id, editData)
      setFullProfile(updated)
      setIsEditing(false)
      setEditData({})
      onTalentUpdated?.({
        ...talent,
        ...updated,
      })
    } catch (error) {
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const updateNestedField = (parent: string, field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }))
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
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
    try {
      const presignedData = await apiClient.getTalentDocUploadUrl(
        talent.id,
        uploadFile.name,
        uploadFile.type || 'application/octet-stream'
      )

      uploadFileToS3(presignedData, originalFile, {
        onProgress: (progress) => {
          setUploadingFiles(prev => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)))
        },
        onSuccess: () => {
          setUploadingFiles(prev => prev.filter(f => f.id !== uploadFile.id))
          loadDocuments()
        },
        onError: (error) => {
          setUploadingFiles(prev =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "error" as const, error: error.message }
                : f,
            ),
          )
        },
      })
    } catch (error) {
      setUploadingFiles(prev =>
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
          talentId: talent.id,
        }
        newFiles.push(uploadFile)
        if (!error) {
          originalFilesRef.current.set(fileId, file)
        }
      })

      setUploadingFiles(prev => [...prev, ...newFiles])

      for (const uploadFile of newFiles.filter((f) => !f.error)) {
        const originalFile = originalFilesRef.current.get(uploadFile.id)
        if (originalFile) {
          uploadToS3(uploadFile, originalFile).catch(() => {})
        }
      }
    },
    [talent.id],
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

  const deleteDocument = async (doc: TalentDocument) => {
    try {
      await apiClient.deleteTalentDoc(talent.id, doc.fileKey)
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    } catch (error) {
    }
  }

  const handleDeleteTalent = async () => {
    setIsDeleting(true)
    try {
      await apiClient.deleteTalent(talent.id)
      setShowDeleteConfirm(false)
      onClose()
      onTalentDeleted()
    } catch (error) {
    } finally {
      setIsDeleting(false)
    }
  }

  const removeUploadingFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
    originalFilesRef.current.delete(fileId)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium">
                  {talent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl">{isEditing ? editData.name : talent.name}</DialogTitle>
                  {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={startEditing} className="h-7 w-7 p-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(isEditing ? editData.category : talent.category)?.split(", ").filter(Boolean).map((cat: string) => (
                    <Badge key={cat} variant="outline">{cat}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="profile" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="documents">
                Documents {documents.length > 0 && `(${documents.length})`}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="profile" className="mt-4 space-y-6">
                {isEditing ? (
                  <>
                    {/* Edit: Name & Category */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Name</label>
                        <Input
                          value={editData.name}
                          onChange={(e) => updateField("name", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Category</label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {["Professional Athlete", "Model", "Entertainer", "Lifestyle Influencer", "Gaming Creator", "Fashion Influencer", "Tech Reviewer", "Fitness Influencer", "Creator"].map((cat) => {
                            const selected = (editData.category || "").split(", ").filter(Boolean).includes(cat)
                            return (
                              <Badge
                                key={cat}
                                variant={selected ? "default" : "outline"}
                                className={`cursor-pointer text-xs ${selected ? "" : "hover:bg-muted"}`}
                                onClick={() => {
                                  const current = (editData.category || "").split(", ").filter(Boolean)
                                  const updated = selected
                                    ? current.filter((c: string) => c !== cat)
                                    : [...current, cat]
                                  updateField("category", updated.join(", "))
                                }}
                              >
                                {cat}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Edit: Bio */}
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bio</label>
                      <Textarea
                        value={editData.bio}
                        onChange={(e) => updateField("bio", e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Edit: Location */}
                    <div>
                      <label className="text-sm font-medium mb-1 block">Location</label>
                      <Input
                        value={editData.location}
                        onChange={(e) => updateField("location", e.target.value)}
                      />
                    </div>

                    {/* Edit: Stats */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Stats</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Followers</label>
                          <Input
                            type="number"
                            value={editData.stats?.followers ?? 0}
                            onChange={(e) => updateNestedField("stats", "followers", Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Engagement %</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={editData.stats?.engagement ?? 0}
                            onChange={(e) => updateNestedField("stats", "engagement", Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Deals</label>
                          <Input
                            type="number"
                            value={editData.stats?.deals ?? 0}
                            onChange={(e) => updateNestedField("stats", "deals", Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Avg Deal Value ($)</label>
                          <Input
                            type="number"
                            value={editData.stats?.avgDealValue ?? 0}
                            onChange={(e) => updateNestedField("stats", "avgDealValue", Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Edit: Social Media */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Social Media</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            placeholder="Instagram handle"
                            value={editData.socialMedia?.instagram || ""}
                            onChange={(e) => updateNestedField("socialMedia", "instagram", e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Twitter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            placeholder="Twitter handle"
                            value={editData.socialMedia?.twitter || ""}
                            onChange={(e) => updateNestedField("socialMedia", "twitter", e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            placeholder="YouTube URL"
                            value={editData.socialMedia?.youtube || ""}
                            onChange={(e) => updateNestedField("socialMedia", "youtube", e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Input
                            placeholder="Website URL"
                            value={editData.socialMedia?.website || ""}
                            onChange={(e) => updateNestedField("socialMedia", "website", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Edit: Status */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Status</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateField("status", editData.status === "active" ? "inactive" : "active")}
                      >
                        <Badge variant={editData.status === "active" ? "default" : "secondary"} className="mr-2">
                          {editData.status}
                        </Badge>
                        Click to toggle
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-secondary rounded-lg text-center">
                        <User className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-2xl font-bold">{formatNumber(talent.stats?.followers || 0)}</p>
                        <p className="text-xs text-muted-foreground">Followers</p>
                      </div>
                      <div className="p-4 bg-secondary rounded-lg text-center">
                        <TrendingUp className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-2xl font-bold">{talent.stats?.engagement || 0}%</p>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>
                      <div className="p-4 bg-secondary rounded-lg text-center">
                        <Star className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-2xl font-bold">{talent.stats?.deals || 0}</p>
                        <p className="text-xs text-muted-foreground">Deals</p>
                      </div>
                    </div>

                    {/* Bio */}
                    {fullProfile?.bio && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Bio</h4>
                        <p className="text-sm text-muted-foreground">{fullProfile.bio}</p>
                      </div>
                    )}

                    {/* Location */}
                    {fullProfile?.location && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Location</h4>
                        <p className="text-sm text-muted-foreground">{fullProfile.location}</p>
                      </div>
                    )}

                    {/* Social Media */}
                    {fullProfile?.socialMedia && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Social Media</h4>
                        <div className="flex flex-wrap gap-2">
                          {fullProfile.socialMedia.instagram && (
                            <a
                              href={`https://instagram.com/${fullProfile.socialMedia.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-lg text-sm hover:bg-secondary/80"
                            >
                              <Instagram className="w-4 h-4" />
                              {fullProfile.socialMedia.instagram}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {fullProfile.socialMedia.twitter && (
                            <a
                              href={`https://twitter.com/${fullProfile.socialMedia.twitter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-lg text-sm hover:bg-secondary/80"
                            >
                              <Twitter className="w-4 h-4" />
                              {fullProfile.socialMedia.twitter}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {fullProfile.socialMedia.youtube && (
                            <a
                              href={fullProfile.socialMedia.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-lg text-sm hover:bg-secondary/80"
                            >
                              <Youtube className="w-4 h-4" />
                              YouTube
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {fullProfile.socialMedia.website && (
                            <a
                              href={fullProfile.socialMedia.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-lg text-sm hover:bg-secondary/80"
                            >
                              <Globe className="w-4 h-4" />
                              Website
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Status</h4>
                      <Badge variant={talent.status === 'active' ? 'default' : 'secondary'}>
                        {talent.status}
                      </Badge>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="documents" className="mt-4 space-y-4">
                {/* Upload Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
                    Supports PDF, Excel, Word, images, and videos up to {formatFileSize(MAX_FILE_SIZE)}
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

                {/* Uploading Files */}
                {uploadingFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Uploading...</h4>
                    {uploadingFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                        <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          {file.status === "uploading" && <Progress value={file.progress} className="h-1 mt-1" />}
                          {file.error && <p className="text-xs text-destructive">{file.error}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUploadingFile(file.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Documents List */}
                {isLoadingDocs ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No documents yet</p>
                    <p className="text-xs">Upload files to build the knowledge base</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Documents ({documents.length})</h4>
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                        <div className="flex-shrink-0">{getFileIcon(doc.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-6 w-6 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDocument(doc)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={cancelEditing} className="mr-auto">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mr-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Talent
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {talent.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this talent profile and all associated documents.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTalent}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
