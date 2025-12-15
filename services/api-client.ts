"use client"

import type { Deal } from "@/types/deal"

// API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface TalentProfile {
  name: string
  email?: string
  agency?: string
  categories: string[]
  exclusivity_constraints: ExclusivityConstraint[]
  past_deals: Record<string, unknown>[]
  preferences: Record<string, unknown>
  notes?: string
  drive_folder_id?: string
}

export interface ExclusivityConstraint {
  brand: string
  category: string
  end_date: string
}

export interface DealOpportunity {
  company_name: string
  company_website?: string
  industry: string
  company_size?: string
  estimated_revenue?: string
  estimated_marketing_budget?: string
  contact_info?: {
    name: string
    email: string
    title: string
  }
  compatibility_score?: number
  reasoning?: string
  potential_deal_value?: string
  status: "potential" | "contacted" | "negotiating" | "closed" | "rejected"
  discovered_at: string
}

export interface DealSearchRequest {
  talent_profile: TalentProfile
  search_params?: {
    max_results?: number
    min_compatibility_score?: number
  }
}

export interface DealSearchResponse {
  deals: DealOpportunity[]
  total_found: number
  search_duration_seconds: number
}

export interface ChatSession {
  session_id: string
  message?: string
  context_loaded?: boolean
}

export interface ChatMessage {
  session_id: string
  response: string
  intent_detected: "qa" | "search_deals" | "update_profile"
  suggestions?: string[]
}

export interface HealthCheck {
  status: string
  message: string
  features: {
    google_auth: boolean
    ai_analysis: string
    redis: string
  }
}

class ApiClient {
  private static instance: ApiClient
  private baseUrl: string

  private constructor() {
    this.baseUrl = API_BASE_URL
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || `API Error: ${response.status}`)
    }

    return response.json()
  }

  // Health check
  async health(): Promise<HealthCheck> {
    return this.request<HealthCheck>("/health")
  }

  // Deal search - synchronous
  async searchDealsSync(request: DealSearchRequest): Promise<DealSearchResponse> {
    return this.request<DealSearchResponse>("/api/deals/search/sync", {
      method: "POST",
      body: JSON.stringify(request),
    })
  }

  // Deal search - async (returns task ID)
  async searchDealsAsync(request: DealSearchRequest): Promise<{ task_id: string; status: string }> {
    return this.request<{ task_id: string; status: string }>("/api/deals/search", {
      method: "POST",
      body: JSON.stringify(request),
    })
  }

  // Check async search status
  async getSearchStatus(taskId: string): Promise<{
    task_id: string
    status: string
    progress?: number
    result?: DealSearchResponse
  }> {
    return this.request(`/api/deals/status/${taskId}`)
  }

  // Chat session management
  async startChatSession(
    driveLink: string,
    credentials?: { access_token: string }
  ): Promise<ChatSession> {
    return this.request<ChatSession>("/api/chat/start", {
      method: "POST",
      body: JSON.stringify({
        drive_link: driveLink,
        credentials,
      }),
    })
  }

  async sendChatMessage(sessionId: string, message: string): Promise<ChatMessage> {
    return this.request<ChatMessage>("/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        message,
      }),
    })
  }

  async saveChatResults(sessionId: string, results: unknown): Promise<{ success: boolean; sheet_url?: string }> {
    return this.request("/api/chat/save-results", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        results,
      }),
    })
  }

  async endChatSession(sessionId: string): Promise<{ success: boolean }> {
    return this.request("/api/chat/end", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
      }),
    })
  }

  // Drive deals
  async analyzeDriveFolder(
    folderId: string,
    credentials: { access_token: string }
  ): Promise<{ talent_profile: TalentProfile; documents_analyzed: number }> {
    return this.request("/api/drive-deals/analyze", {
      method: "POST",
      body: JSON.stringify({
        folder_id: folderId,
        credentials,
      }),
    })
  }

  async searchDriveDeals(
    folderId: string,
    credentials: { access_token: string },
    searchParams?: { max_results?: number }
  ): Promise<DealSearchResponse> {
    return this.request("/api/drive-deals/search", {
      method: "POST",
      body: JSON.stringify({
        folder_id: folderId,
        credentials,
        search_params: searchParams,
      }),
    })
  }

  async exportToSheet(
    deals: DealOpportunity[],
    credentials: { access_token: string },
    spreadsheetName?: string
  ): Promise<{ success: boolean; spreadsheet_url?: string }> {
    return this.request("/api/drive-deals/export", {
      method: "POST",
      body: JSON.stringify({
        deals,
        credentials,
        spreadsheet_name: spreadsheetName,
      }),
    })
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance()

// Helper to convert backend DealOpportunity to frontend Deal format
export function convertToDeal(opportunity: DealOpportunity, index: number): Deal {
  return {
    id: `deal-${Date.now()}-${index}`,
    brand: opportunity.company_name,
    title: `Partnership with ${opportunity.company_name}`,
    category: opportunity.industry,
    valueRange: opportunity.potential_deal_value || "TBD",
    matchScore: Math.round((opportunity.compatibility_score || 0) * 10),
    description: opportunity.reasoning || `Partnership opportunity with ${opportunity.company_name}`,
    tags: [opportunity.industry, opportunity.company_size || ""].filter(Boolean),
    deadline: undefined,
    requirements: [],
    engagement: 0,
    reach: "",
    conversions: "",
    industry: opportunity.industry,
    companySize: opportunity.company_size || "",
    duration: "",
    startDate: "",
    contact: opportunity.contact_info
      ? {
          name: opportunity.contact_info.name,
          email: opportunity.contact_info.email,
          department: opportunity.contact_info.title,
        }
      : undefined,
    status: opportunity.status === "potential" ? "new" : opportunity.status,
    createdAt: opportunity.discovered_at,
    updatedAt: opportunity.discovered_at,
  }
}
