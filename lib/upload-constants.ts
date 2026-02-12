export const ACCEPTED_TYPES: Record<string, string[]> = {
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

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
