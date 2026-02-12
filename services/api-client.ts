"use client"

import type { Deal } from "@/types/deal"
import type { TalentProfile, TalentDocument } from "@/types/talent"

// API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface DealSearchTalentProfile {
  name: string
  email?: string
  agency?: string
  categories: string[]
  exclusivity_constraints: {
    brand: string
    category: string
    end_date: string
  }[]
  past_deals: Record<string, unknown>[]
  preferences: Record<string, unknown>
  notes?: string
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
  talent_profile: DealSearchTalentProfile
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
  deals_loaded?: number
  files_loaded?: number
  talent_name?: string
  categories?: string[]
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

export interface AuthUser {
  email: string
  name: string
  picture: string
}

const SESSION_KEY = "hyper-talent-session-id"

class ApiClient {
  private static instance: ApiClient
  private baseUrl: string
  private sessionId: string | null = null

  private constructor() {
    this.baseUrl = API_BASE_URL
    if (typeof window !== "undefined") {
      this.sessionId = localStorage.getItem(SESSION_KEY)
    }
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  // --- Session management ---

  setSessionId(id: string | null): void {
    this.sessionId = id
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem(SESSION_KEY, id)
      } else {
        localStorage.removeItem(SESSION_KEY)
      }
    }
  }

  getSessionId(): string | null {
    return this.sessionId
  }

  getLoginUrl(): string {
    const redirectUri = typeof window !== "undefined" ? window.location.origin : ""
    return `${this.baseUrl}/auth/login?redirect_uri=${encodeURIComponent(redirectUri)}`
  }

  async getMe(): Promise<AuthUser> {
    return this.request<AuthUser>("/auth/me")
  }

  async logout(): Promise<void> {
    try {
      await this.request<{ status: string }>("/auth/logout", { method: "POST" })
    } finally {
      this.setSessionId(null)
    }
  }

  // --- Core request ---

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (this.sessionId) {
      defaultHeaders["X-Session-ID"] = this.sessionId
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (response.status === 401) {
      this.setSessionId(null)
      if (typeof window !== "undefined") {
        window.location.reload()
      }
      throw new Error("Session expired")
    }

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
  async startChatSession(params: {
    talent_id: string
    talent_name: string
  }): Promise<ChatSession> {
    return this.request<ChatSession>("/api/chat/start", {
      method: "POST",
      body: JSON.stringify(params),
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

  // ==================== TALENT MANAGEMENT ====================

  async getTalents(): Promise<{ talents: TalentProfile[] }> {
    return this.request("/api/talents")
  }

  async getTalent(talentId: string): Promise<TalentProfile> {
    return this.request(`/api/talents/${talentId}`)
  }

  async createTalent(data: Record<string, unknown>): Promise<TalentProfile> {
    return this.request("/api/talents", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async deleteTalent(talentId: string): Promise<{ success: boolean }> {
    return this.request(`/api/talents/${talentId}`, {
      method: "DELETE",
    })
  }

  async updateTalent(talentId: string, data: Record<string, unknown>): Promise<TalentProfile> {
    return this.request(`/api/talents/${talentId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async getTalentDocs(talentId: string): Promise<{ documents: TalentDocument[] }> {
    return this.request(`/api/talents/${talentId}/docs`)
  }

  async getTalentDocUploadUrl(
    talentId: string,
    filename: string,
    contentType: string
  ): Promise<{ upload_url: string; fields: Record<string, string>; file_key: string; file_id: string; public_url: string }> {
    return this.request(`/api/talents/${talentId}/docs/upload-url`, {
      method: "POST",
      body: JSON.stringify({ filename, content_type: contentType }),
    })
  }

  async deleteTalentDoc(talentId: string, fileKey: string): Promise<{ success: boolean }> {
    return this.request(`/api/talents/${talentId}/docs/${encodeURIComponent(fileKey)}`, {
      method: "DELETE",
    })
  }

  // ==================== USERS ====================

  async getUsers(): Promise<{ users: { id: string; email: string; name: string; picture?: string; last_login?: string }[] }> {
    return this.request("/api/users")
  }

  // ==================== FILE UPLOADS ====================

  async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    talentId?: string
  ): Promise<{ upload_url: string; fields: Record<string, string>; file_key: string; public_url: string }> {
    return this.request("/api/uploads/presigned-url", {
      method: "POST",
      body: JSON.stringify({ filename, content_type: contentType, talent_id: talentId }),
    })
  }

  async deleteUploadedFile(fileKey: string): Promise<{ success: boolean }> {
    return this.request("/api/uploads/files", {
      method: "DELETE",
      body: JSON.stringify({ file_key: fileKey }),
    })
  }

  // ==================== DEAL DISCOVERY ====================

  async getSavedDealFiles(talentId: string): Promise<{ deal_files: Record<string, unknown>[] }> {
    return this.request(`/api/discovery/deals/${talentId}`)
  }

  async loadDealFile(talentId: string, filename: string): Promise<Record<string, unknown>> {
    return this.request(`/api/discovery/deals/${talentId}/${filename}`)
  }

  async deleteDealFile(talentId: string, filename: string): Promise<{ success: boolean }> {
    return this.request(`/api/discovery/deals/${talentId}/${filename}`, {
      method: "DELETE",
    })
  }

  async saveDeals(
    talentId: string,
    talentName: string,
    prompt: string,
    deals: Record<string, unknown>[]
  ): Promise<{ filename: string } & Record<string, unknown>> {
    return this.request("/api/discovery/save-deals", {
      method: "POST",
      body: JSON.stringify({ talent_id: talentId, talent_name: talentName, prompt, deals }),
    })
  }

  // ==================== AI DISCOVERY AGENTS ====================

  async runAgent(agentName: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.request(`/api/discovery/agent/${agentName}`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  /**
   * Stream discovery via SSE — deals arrive one-by-one as they are found.
   */
  async streamDiscovery(
    payload: {
      talent_id: string
      talent_name: string
      talent_profile: Record<string, unknown>
      search_prompt?: string
      search_duration_minutes?: number
      entity_type?: string
    },
    callbacks: {
      onStatus: (status: { phase: string; round?: number; total_deals?: number; message: string }) => void
      onDeal: (deal: Record<string, unknown>) => void
      onComplete: (summary: { total_deals: number; processing_time_ms: number }) => void
      onError?: (error: Error) => void
    },
    signal?: AbortSignal
  ): Promise<void> {
    const url = `${this.baseUrl}/api/discovery/stream`
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (this.sessionId) {
      headers["X-Session-ID"] = this.sessionId
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal,
    })

    if (response.status === 401) {
      this.setSessionId(null)
      if (typeof window !== "undefined") window.location.reload()
      throw new Error("Session expired")
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ detail: response.statusText }))
      const error = new Error(errBody.detail || `API Error: ${response.status}`)
      callbacks.onError?.(error)
      throw error
    }

    const reader = response.body?.getReader()
    if (!reader) {
      const error = new Error("No response body")
      callbacks.onError?.(error)
      throw error
    }

    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE messages are separated by double newlines
        const messages = buffer.split("\n\n")
        // Keep the last (potentially incomplete) chunk in the buffer
        buffer = messages.pop() || ""

        for (const msg of messages) {
          if (!msg.trim()) continue

          let eventType = "message"
          let data = ""

          for (const line of msg.split("\n")) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith("data: ")) {
              data = line.slice(6)
            }
          }

          if (!data) continue

          try {
            const parsed = JSON.parse(data)
            switch (eventType) {
              case "status":
                callbacks.onStatus(parsed)
                break
              case "deal":
                callbacks.onDeal(parsed)
                break
              case "complete":
                callbacks.onComplete(parsed)
                break
            }
          } catch (parseErr) {
            console.warn("Failed to parse SSE event:", data, parseErr)
          }
        }
      }
    } catch (err) {
      callbacks.onError?.(err instanceof Error ? err : new Error(String(err)))
    } finally {
      reader.releaseLock()
    }
  }

  // ==================== DEAL TRACKING (DynamoDB) ====================

  /**
   * Persist discovered deals to DynamoDB for tracking
   */
  async persistDeals(
    talentId: string,
    deals: Array<Record<string, unknown>>
  ): Promise<{ success: boolean; deals_count: number; deal_ids: string[] }> {
    return this.request("/api/discovery/tracked-deals/persist", {
      method: "POST",
      body: JSON.stringify({
        talent_id: talentId,
        deals,
      }),
    })
  }

  /**
   * Get all tracked deals for a talent
   */
  async getTrackedDeals(
    talentId: string,
    status?: string
  ): Promise<{ talent_id: string; deals: TrackedDeal[]; count: number }> {
    const query = status ? `?status=${status}` : ""
    return this.request(`/api/discovery/tracked-deals/${talentId}${query}`)
  }

  /**
   * Update the status of a tracked deal
   */
  async updateDealStatus(
    talentId: string,
    dealId: string,
    status: "potential" | "contacted" | "negotiating" | "closed" | "rejected",
    notes?: string
  ): Promise<{ success: boolean; deal: TrackedDeal }> {
    return this.request(`/api/discovery/tracked-deals/${talentId}/${dealId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    })
  }

  /**
   * Delete a tracked deal
   */
  async deleteDeal(talentId: string, dealId: string): Promise<{ success: boolean }> {
    return this.request(`/api/discovery/tracked-deals/${talentId}/${dealId}`, {
      method: "DELETE",
    })
  }

  // ==================== APOLLO CONTACT ENRICHMENT ====================

  /**
   * Check if Apollo API is configured
   */
  async getApolloStatus(): Promise<{ configured: boolean; message: string }> {
    return this.request("/api/discovery/apollo-status")
  }

  /**
   * Enrich multiple deals with contact information from Apollo
   */
  async enrichDealsWithContacts(
    deals: Array<{ brand: string; website?: string }>
  ): Promise<{
    success: boolean
    message: string
    deals: Array<Record<string, unknown>>
    contacts_found: number
    total_deals: number
  }> {
    return this.request("/api/discovery/enrich-contacts", {
      method: "POST",
      body: JSON.stringify({ deals }),
    })
  }

  /**
   * Find the best contact at a single company
   */
  async findContact(
    brand: string,
    website?: string
  ): Promise<{
    success: boolean
    brand: string
    contact: ApolloContact | null
    message?: string
  }> {
    return this.request("/api/discovery/enrich-contact", {
      method: "POST",
      body: JSON.stringify({ brand, website }),
    })
  }

  /**
   * Find contact via Apollo AND save to DynamoDB in one call
   * @param rolePrompt Optional specific role to search for (e.g., "chief brand ambassador", "media manager for women's sportswear")
   */
  async findAndSaveContact(
    talentId: string,
    dealId: string,
    brand: string,
    website?: string,
    rolePrompt?: string
  ): Promise<{
    success: boolean
    message: string
    deal_id: string
    contact: ApolloContact | null
    deal?: Record<string, unknown>
  }> {
    return this.request("/api/discovery/find-and-save-contact", {
      method: "POST",
      body: JSON.stringify({
        talent_id: talentId,
        deal_id: dealId,
        brand,
        website,
        role_prompt: rolePrompt,
      }),
    })
  }
}

// Apollo contact from enrichment
export interface ApolloContact {
  id: string
  name: string
  title?: string
  email?: string
  phone?: string
  linkedin_url?: string
  company_name?: string
  confidence_score: number
}

// Tracked deal from DynamoDB
export interface TrackedDeal {
  talent_id: string
  deal_id: string
  brand: string
  industry: string
  match_score: number
  budget_range: string
  status: "potential" | "contacted" | "negotiating" | "closed" | "rejected"
  categories: string[]
  deal_types: string[]
  match_reasons: string[]
  recommended_approach: string
  estimated_value: string
  success_probability: number
  priority: string
  timeline: string
  website?: string
  contact_info?: {
    apollo_id?: string
    name: string
    email?: string
    title?: string
    phone?: string
    linkedin_url?: string
    confidence_score?: string  // Stored as string in DynamoDB
  }
  created_at: string
  updated_at: string
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
