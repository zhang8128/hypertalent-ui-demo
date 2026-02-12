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
    avgDealValue?: number
  }
  socialMedia?: {
    instagram?: string
    twitter?: string
    youtube?: string
    tiktok?: string
    website?: string
  }
  demographics?: {
    ageRange: string
    topLocations: string[]
    interests: string[]
  }
  brandAlignment?: {
    categories: string[]
    values: string[]
    pastBrands: string[]
  }
  goals?: {
    targetDeals: number
    preferredCategories: string[]
    minDealValue: number
  }
  status: "active" | "inactive" | string
  type?: "talent" | "company"
  documents?: TalentDocument[]
  createdAt?: string
  updatedAt?: string
}

export interface TalentDocument {
  id: string
  name: string
  size: number
  type: string
  url: string
  fileKey: string
  uploadedAt: string
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "completed" | "error" | "processing"
  progress: number
  url?: string
  error?: string
  talentId?: string
  fileKey?: string
}
