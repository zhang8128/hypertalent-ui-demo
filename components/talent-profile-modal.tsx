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
import {
  User,
  Star,
  TrendingUp,
  Upload,
  X,
  RefreshCw,
  FileText,
  ImageIcon,
  Video,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  ExternalLink,
} from "lucide-react"
import { useState, useCallback, useRef, useEffect } from "react"
import type { TalentProfile, UploadedFile } from "./talent-selector"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://qaqyqok7j0.execute-api.us-east-1.amazonaws.com'

interface TalentDocument {
  id: string
  name: string
  size: number
  type: string
  url: string
  fileKey: string
  uploadedAt: string
}

interface TalentProfileModalProps {
  talent: TalentProfile
  isOpen: boolean
  onClose: () => void
  onTalentDeleted: () => void
  onTalentUpdated?: (talent: TalentProfile) => void
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  "video/*": [".mp4", ".mov", ".avi", ".mkv"],
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

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
      const response = await fetch(`${API_URL}/api/talents/${talent.id}/docs`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setIsLoadingDocs(false)
    }
  }

  const loadFullProfile = async () => {
    if (!talent?.id) return
    try {
      const response = await fetch(`${API_URL}/api/talents/${talent.id}`)
      if (response.ok) {
        const data = await response.json()
        setFullProfile(data)
      }
    } catch (error) {
      console.error('Failed to load full profile:', error)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="w-4 h-4" />
    if (type.includes("sheet") || type.includes("excel")) return <FileSpreadsheet className="w-4 h-4" />
    if (type.includes("image")) return <ImageIcon className="w-4 h-4" />
    if (type.includes("video")) return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
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
      const presignedResponse = await fetch(`${API_URL}/api/talents/${talent.id}/docs/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadFile.name,
          content_type: uploadFile.type || 'application/octet-stream',
        })
      })

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const presignedData = await presignedResponse.json()

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100
            setUploadingFiles(prev => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadingFiles(prev => prev.filter(f => f.id !== uploadFile.id))
            // Reload documents list
            loadDocuments()
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'))
        })

        const formData = new FormData()
        Object.entries(presignedData.fields).forEach(([key, value]) => {
          formData.append(key, value as string)
        })
        formData.append('file', originalFile)

        xhr.open('POST', presignedData.upload_url)
        xhr.send(formData)
      })
    } catch (error) {
      setUploadingFiles(prev =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "error" as const, error: error instanceof Error ? error.message : "Upload failed" }
            : f,
        ),
      )
      throw error
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
          uploadToS3(uploadFile, originalFile).catch(console.error)
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
      await fetch(`${API_URL}/api/talents/${talent.id}/docs/${encodeURIComponent(doc.fileKey)}`, {
        method: 'DELETE'
      })
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const handleDeleteTalent = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`${API_URL}/api/talents/${talent.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setShowDeleteConfirm(false)
        onClose()
        onTalentDeleted()
      }
    } catch (error) {
      console.error('Failed to delete talent:', error)
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
              <div>
                <DialogTitle className="text-xl">{talent.name}</DialogTitle>
                <Badge variant="outline" className="mt-1">{talent.category}</Badge>
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
