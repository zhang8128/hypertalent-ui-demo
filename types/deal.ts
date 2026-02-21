export interface Deal {
  id: string
  dealId?: string  // DynamoDB deal_id for persistence
  talentId?: string  // Associated talent for API calls
  brand: string
  title: string
  category: string
  valueRange: string
  matchScore: number
  description: string
  tags: string[]
  deadline?: string
  requirements?: string[]
  engagement?: number
  reach?: string
  conversions?: string
  industry?: string
  website?: string
  companySize?: string
  duration?: string
  startDate?: string
  contact?: {
    name?: string
    email?: string
    department?: string
  }
  // Apollo contact enrichment
  apolloContact?: {
    id: string
    name: string
    title?: string
    email?: string
    phone?: string
    linkedin_url?: string
    confidence_score: number
  }
  estimatedValue?: number | string
  successProbability?: number
  priority?: string
  recommendedApproach?: string
  linkedStepId?: string
  status?: "new" | "contacted" | "negotiating" | "closed" | "rejected"
  createdAt: string
  updatedAt: string
  // Deal Hunter source fields
  source?: string           // "web_search" | "collabstr" | "aspire" | "linkedin" | "meeting_notes" | etc.
  sourceUrl?: string        // Direct link to campaign listing
  campaignDetails?: {
    deadline?: string
    requirements?: string[]
    compensationType?: "paid" | "gifted" | "affiliate" | "hybrid" | "unknown"
    platformFocus?: string
    followUp?: string
    urgency?: "high" | "medium" | "low"
  }
  crmData?: {
    accountManager: string
    lastContact?: string
    nextFollowUp?: string
    contactHistory: Array<{
      date: string
      type: "email" | "call" | "meeting" | "note"
      subject: string
      outcome?: string
    }>
    dealStage: "prospecting" | "qualification" | "proposal" | "negotiation" | "closed-won" | "closed-lost"
    assignedTo?: string
  }
  pipelineData?: {
    probability: number
    expectedCloseDate?: string
    dealValue: number
    stage: string
    daysInStage: number
    lastActivity?: string
    nextAction?: string
  }
  emailTracking?: {
    sent: number
    opened: number
    replied: number
    clicked: number
    bounced: number
    lastEmailDate?: string
    engagementScore: number
  }
}
