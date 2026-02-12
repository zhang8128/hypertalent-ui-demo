import { FileText, ImageIcon, Video, FileSpreadsheet } from "lucide-react"
import { createElement, type ReactNode } from "react"

export interface PresignedData {
  upload_url: string
  fields: Record<string, string>
  public_url: string
  file_key: string
  file_id?: string
}

export interface UploadCallbacks {
  onProgress: (progress: number) => void
  onSuccess: (presignedData: PresignedData) => void
  onError: (error: Error) => void
}

/**
 * Upload a file to S3 using a presigned POST with progress tracking.
 */
export function uploadFileToS3(
  presignedData: PresignedData,
  file: File,
  callbacks: UploadCallbacks
): void {
  const xhr = new XMLHttpRequest()

  xhr.upload.addEventListener("progress", (event) => {
    if (event.lengthComputable) {
      const progress = (event.loaded / event.total) * 100
      callbacks.onProgress(progress)
    }
  })

  xhr.addEventListener("load", () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      callbacks.onSuccess(presignedData)
    } else {
      callbacks.onError(new Error(`Upload failed with status ${xhr.status}`))
    }
  })

  xhr.addEventListener("error", () => {
    callbacks.onError(new Error("Upload failed"))
  })

  const formData = new FormData()
  Object.entries(presignedData.fields).forEach(([key, value]) => {
    formData.append(key, value as string)
  })
  formData.append("file", file)

  xhr.open("POST", presignedData.upload_url)
  xhr.send(formData)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function getFileIcon(type: string, className = "w-4 h-4"): ReactNode {
  if (type.includes("pdf")) return createElement(FileText, { className })
  if (type.includes("sheet") || type.includes("excel")) return createElement(FileSpreadsheet, { className })
  if (type.includes("image")) return createElement(ImageIcon, { className })
  if (type.includes("video")) return createElement(Video, { className })
  return createElement(FileText, { className })
}
