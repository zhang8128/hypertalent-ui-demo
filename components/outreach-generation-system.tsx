"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Mail, Sparkles, Copy, Send, RefreshCw, FileText, Brain, Zap, CheckCircle, Edit3, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import type { Deal } from "@/types/deal"
import type { TalentProfile } from "@/types/talent"

interface OutreachTemplate {
  id: string
  name: string
  category: string
  tone: "professional" | "casual" | "enthusiastic" | "formal"
  subject: string
  content: string
  variables: string[]
  createdAt: string
  lastUsed?: string
}

interface OutreachGenerationProps {
  deal: Deal | null
  talent: TalentProfile | null
  isOpen: boolean
  onClose: () => void
  onEmailSent?: (deal: Deal, email: string) => void
}

interface GenerationStep {
  id: string
  name: string
  description: string
  status: "pending" | "running" | "completed" | "error"
  progress: number
  result?: any
}

const defaultTemplates: OutreachTemplate[] = [
  {
    id: "professional-partnership",
    name: "Professional Partnership",
    category: "Partnership",
    tone: "professional",
    subject: "Partnership Opportunity - {{BRAND}} x {{TALENT_NAME}}",
    content: `Dear {{CONTACT_NAME}},

I hope this email finds you well. I'm reaching out regarding an exciting partnership opportunity between {{BRAND}} and {{TALENT_NAME}}.

{{TALENT_NAME}} is a {{TALENT_CATEGORY}} with a strong alignment to {{BRAND}}'s brand values and target audience. Based on our analysis, this partnership has a {{MATCH_SCORE}}/10 match score, indicating excellent potential for mutual success.

Key Highlights:
• Strong audience alignment with {{BRAND}}'s target demographic
• Proven track record in {{TALENT_CATEGORY}} partnerships
• Expected engagement rate of {{ENGAGEMENT_RATE}}%
• Estimated reach of {{REACH}} across all platforms

{{TALENT_NAME}} would be excited to collaborate on {{DEAL_TITLE}}, bringing authentic storytelling and genuine brand advocacy to the partnership.

I'd love to schedule a brief call to discuss how we can create a compelling campaign that drives real results for {{BRAND}}.

Best regards,
{{SENDER_NAME}}
{{SENDER_TITLE}}
Hyper Talent Agency`,
    variables: [
      "BRAND",
      "TALENT_NAME",
      "CONTACT_NAME",
      "TALENT_CATEGORY",
      "MATCH_SCORE",
      "ENGAGEMENT_RATE",
      "REACH",
      "DEAL_TITLE",
      "SENDER_NAME",
      "SENDER_TITLE",
    ],
    createdAt: "2024-01-01",
  },
  {
    id: "casual-collaboration",
    name: "Casual Collaboration",
    category: "Collaboration",
    tone: "casual",
    subject: "Let's create something amazing together - {{TALENT_NAME}} x {{BRAND}}",
    content: `Hi {{CONTACT_NAME}},

Hope you're having a great day! I wanted to reach out about a collaboration opportunity that I think could be really exciting for both {{BRAND}} and {{TALENT_NAME}}.

{{TALENT_NAME}} has been following {{BRAND}} for a while and genuinely loves what you're doing in the {{CATEGORY}} space. With {{FOLLOWERS}} followers and a {{ENGAGEMENT_RATE}}% engagement rate, they've built an incredibly engaged community that aligns perfectly with your target audience.

What makes this partnership special:
✨ Authentic brand affinity - {{TALENT_NAME}} is already a fan
✨ High-quality content creation with proven results
✨ Engaged audience in the {{DEMOGRAPHIC}} demographic
✨ Creative approach to storytelling that drives action

I'd love to hop on a quick call to brainstorm some creative ideas for {{DEAL_TITLE}}. When works best for you this week?

Looking forward to creating something amazing together!

Cheers,
{{SENDER_NAME}}`,
    variables: [
      "CONTACT_NAME",
      "BRAND",
      "TALENT_NAME",
      "CATEGORY",
      "FOLLOWERS",
      "ENGAGEMENT_RATE",
      "DEMOGRAPHIC",
      "DEAL_TITLE",
      "SENDER_NAME",
    ],
    createdAt: "2024-01-01",
  },
  {
    id: "high-value-proposal",
    name: "High-Value Proposal",
    category: "Premium",
    tone: "formal",
    subject: "Strategic Partnership Proposal - {{BRAND}} x {{TALENT_NAME}}",
    content: `Dear {{CONTACT_NAME}},

I am writing to present a strategic partnership opportunity between {{BRAND}} and {{TALENT_NAME}} that aligns with your brand's objectives and market positioning.

Partnership Overview:
{{TALENT_NAME}} is a distinguished {{TALENT_CATEGORY}} with a verified track record of successful brand collaborations. Our comprehensive analysis indicates a {{MATCH_SCORE}}/10 compatibility score, reflecting exceptional alignment between your brand values and their audience demographics.

Performance Metrics:
• Audience Size: {{FOLLOWERS}} highly engaged followers
• Engagement Rate: {{ENGAGEMENT_RATE}}% (above industry average)
• Demographic Alignment: {{DEMOGRAPHIC_MATCH}}% match with your target market
• Previous Campaign Performance: {{CONVERSION_RATE}}% average conversion rate

Investment & ROI:
The proposed partnership falls within your {{VALUE_RANGE}} budget allocation and is projected to deliver:
• Estimated reach of {{REACH}} impressions
• Projected engagement of {{PROJECTED_ENGAGEMENT}} interactions
• Expected conversion rate of {{CONVERSION_RATE}}%

I would welcome the opportunity to discuss this proposal in detail and explore how we can structure a partnership that delivers measurable results for {{BRAND}}.

Sincerely,
{{SENDER_NAME}}
{{SENDER_TITLE}}
{{COMPANY_NAME}}`,
    variables: [
      "CONTACT_NAME",
      "BRAND",
      "TALENT_NAME",
      "TALENT_CATEGORY",
      "MATCH_SCORE",
      "FOLLOWERS",
      "ENGAGEMENT_RATE",
      "DEMOGRAPHIC_MATCH",
      "CONVERSION_RATE",
      "VALUE_RANGE",
      "REACH",
      "PROJECTED_ENGAGEMENT",
      "SENDER_NAME",
      "SENDER_TITLE",
      "COMPANY_NAME",
    ],
    createdAt: "2024-01-01",
  },
]

export function OutreachGenerationSystem({ deal, talent, isOpen, onClose, onEmailSent }: OutreachGenerationProps) {
  const [activeTab, setActiveTab] = useState("generate")
  const [selectedTemplate, setSelectedTemplate] = useState<OutreachTemplate | null>(null)
  const [customTemplate, setCustomTemplate] = useState("")
  const [generatedEmail, setGeneratedEmail] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
  const [templates, setTemplates] = useState<OutreachTemplate[]>(defaultTemplates)
  const [editingTemplate, setEditingTemplate] = useState<OutreachTemplate | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  // Generation configuration
  const [generationConfig, setGenerationConfig] = useState({
    tone: "professional" as "professional" | "casual" | "enthusiastic" | "formal",
    length: "medium" as "short" | "medium" | "long",
    includeMetrics: true,
    includeCallToAction: true,
    personalization: "high" as "low" | "medium" | "high",
    senderName: "Sarah Martinez",
    senderTitle: "Partnership Manager",
    companyName: "Hyper Talent Agency",
  })

  const initializeGenerationSteps = (): GenerationStep[] => [
    {
      id: "analyze-talent",
      name: "Talent Analysis",
      description: "Analyzing talent profile, audience demographics, and performance metrics",
      status: "pending",
      progress: 0,
    },
    {
      id: "brand-research",
      name: "Brand Research",
      description: "Researching brand values, recent campaigns, and partnership preferences",
      status: "pending",
      progress: 0,
    },
    {
      id: "audience-alignment",
      name: "Audience Alignment",
      description: "Calculating audience overlap and demographic compatibility",
      status: "pending",
      progress: 0,
    },
    {
      id: "content-generation",
      name: "Content Generation",
      description: "Generating personalized outreach content with AI optimization",
      status: "pending",
      progress: 0,
    },
    {
      id: "optimization",
      name: "Email Optimization",
      description: "Optimizing subject line, tone, and call-to-action for maximum response rate",
      status: "pending",
      progress: 0,
    },
  ]

  const runGenerationStep = async (stepId: string): Promise<void> => {
    return new Promise((resolve) => {
      setGenerationSteps((prev) =>
        prev.map((step) => (step.id === stepId ? { ...step, status: "running", progress: 0 } : step)),
      )

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationSteps((prev) =>
          prev.map((step) => {
            if (step.id === stepId && step.status === "running") {
              const newProgress = Math.min(step.progress + Math.random() * 30, 95)
              return { ...step, progress: newProgress }
            }
            return step
          }),
        )
      }, 200)

      // Complete step after delay
      setTimeout(
        () => {
          clearInterval(progressInterval)

          let result = {}
          switch (stepId) {
            case "analyze-talent":
              result = {
                audienceSize: talent?.stats.followers || 0,
                engagementRate: talent?.stats.engagement || 0,
                topCategories: talent?.brandAlignment.categories || [],
              }
              break
            case "brand-research":
              result = {
                brandValues: ["Innovation", "Quality", "Performance"],
                recentCampaigns: ["Summer Collection", "Athlete Series"],
                preferredPartnershipType: deal?.category || "Brand Partnership",
              }
              break
            case "audience-alignment":
              result = {
                overlapScore: deal?.matchScore || 8.5,
                demographicMatch: "85%",
                interestAlignment: ["Sports", "Fitness", "Lifestyle"],
              }
              break
            case "content-generation":
              result = {
                emailGenerated: true,
                personalizedElements: 12,
                toneScore: 9.2,
              }
              break
            case "optimization":
              result = {
                subjectLineScore: 8.7,
                readabilityScore: 9.1,
                responseRatePrediction: "23%",
              }
              break
          }

          setGenerationSteps((prev) =>
            prev.map((step) => (step.id === stepId ? { ...step, status: "completed", progress: 100, result } : step)),
          )

          resolve()
        },
        1500 + Math.random() * 2000,
      )
    })
  }

  const generateOutreachEmail = async () => {
    if (!deal || !talent) return

    setIsGenerating(true)
    setGenerationSteps(initializeGenerationSteps())

    try {
      // Run generation steps sequentially
      const steps = initializeGenerationSteps()
      for (const step of steps) {
        await runGenerationStep(step.id)
      }

      // Generate final email content
      const template = selectedTemplate || templates[0]
      let emailContent = template.content
      let subject = template.subject

      // Replace variables with actual values
      const variables = {
        BRAND: deal.brand,
        TALENT_NAME: talent.name,
        CONTACT_NAME: deal.contact?.name || "Partnership Team",
        TALENT_CATEGORY: talent.category.toLowerCase(),
        MATCH_SCORE: deal.matchScore.toString(),
        ENGAGEMENT_RATE: talent.stats.engagement.toString(),
        REACH:
          talent.stats.followers >= 1000000
            ? `${(talent.stats.followers / 1000000).toFixed(1)}M`
            : `${(talent.stats.followers / 1000).toFixed(0)}K`,
        DEAL_TITLE: deal.title,
        SENDER_NAME: generationConfig.senderName,
        SENDER_TITLE: generationConfig.senderTitle,
        COMPANY_NAME: generationConfig.companyName,
        FOLLOWERS:
          talent.stats.followers >= 1000000
            ? `${(talent.stats.followers / 1000000).toFixed(1)}M`
            : `${(talent.stats.followers / 1000).toFixed(0)}K`,
        CATEGORY: deal.category,
        DEMOGRAPHIC: talent.demographics.ageRange,
        VALUE_RANGE: deal.valueRange,
        CONVERSION_RATE: deal.conversions || "3.2",
        DEMOGRAPHIC_MATCH: "85",
        PROJECTED_ENGAGEMENT: Math.floor(talent.stats.followers * (talent.stats.engagement / 100)).toString(),
      }

      // Replace all variables in content and subject
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g")
        emailContent = emailContent.replace(regex, value)
        subject = subject.replace(regex, value)
      })

      setGeneratedEmail(emailContent)
      setEmailSubject(subject)
    } catch (error) {
      console.error("Generation error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      const fullEmail = `Subject: ${emailSubject}\n\n${generatedEmail}`
      await navigator.clipboard.writeText(fullEmail)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const sendEmail = () => {
    if (!deal || !generatedEmail) return

    const subject = encodeURIComponent(emailSubject)
    const body = encodeURIComponent(generatedEmail)
    const mailto = `mailto:${deal.contact?.email || "partnerships@brand.com"}?subject=${subject}&body=${body}`
    window.open(mailto)

    if (onEmailSent) {
      onEmailSent(deal, generatedEmail)
    }
  }

  const saveTemplate = () => {
    if (!editingTemplate) return

    setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? editingTemplate : t)))
    setEditingTemplate(null)
  }

  const deleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId))
  }

  useEffect(() => {
    if (isOpen && deal && talent) {
      setSelectedTemplate(templates[0])
      setGeneratedEmail("")
      setEmailSubject("")
    }
  }, [isOpen, deal, talent])

  if (!deal || !talent) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Outreach Generation - {deal.brand}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            {/* Deal Summary */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Partnership Opportunity</h3>
                <Badge variant="default">Match: {deal.matchScore}/10</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Brand:</span> {deal.brand}
                </div>
                <div>
                  <span className="text-muted-foreground">Value:</span> {deal.valueRange}
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span> {deal.category}
                </div>
                <div>
                  <span className="text-muted-foreground">Contact:</span> {deal.contact?.name || "Partnership Team"}
                </div>
              </div>
            </Card>

            {/* Template Selection */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Select Template</h3>
              <div className="grid grid-cols-3 gap-3">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {template.tone}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{template.category}</p>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Generation Process */}
            {isGenerating && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Generation Process
                </h3>
                <div className="space-y-3">
                  {generationSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {step.status === "completed" && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {step.status === "running" && <Zap className="w-4 h-4 text-blue-500 animate-pulse" />}
                        {step.status === "pending" && <div className="w-4 h-4 rounded-full bg-muted" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{step.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {step.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                        {step.status === "running" && <Progress value={step.progress} className="h-1 mt-2" />}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                onClick={generateOutreachEmail}
                disabled={isGenerating || !selectedTemplate}
                size="lg"
                className="gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {isGenerating ? "Generating..." : "Generate AI Outreach"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Email Templates</h3>
              <Button size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                New Template
              </Button>
            </div>

            <div className="space-y-3">
              {templates.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="outline">{template.tone}</Badge>
                        <Badge variant="secondary">{template.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Subject: {template.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.variables.length} variables • Created {template.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(template)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteTemplate(template.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Generation Settings</h3>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Email Tone</Label>
                    <Select
                      value={generationConfig.tone}
                      onValueChange={(value: any) => setGenerationConfig((prev) => ({ ...prev, tone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Email Length</Label>
                    <Select
                      value={generationConfig.length}
                      onValueChange={(value: any) => setGenerationConfig((prev) => ({ ...prev, length: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (100-150 words)</SelectItem>
                        <SelectItem value="medium">Medium (150-250 words)</SelectItem>
                        <SelectItem value="long">Long (250+ words)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Personalization Level</Label>
                    <Select
                      value={generationConfig.personalization}
                      onValueChange={(value: any) =>
                        setGenerationConfig((prev) => ({ ...prev, personalization: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Basic details only</SelectItem>
                        <SelectItem value="medium">Medium - Include metrics</SelectItem>
                        <SelectItem value="high">High - Deep personalization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Sender Name</Label>
                    <Input
                      value={generationConfig.senderName}
                      onChange={(e) => setGenerationConfig((prev) => ({ ...prev, senderName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Sender Title</Label>
                    <Input
                      value={generationConfig.senderTitle}
                      onChange={(e) => setGenerationConfig((prev) => ({ ...prev, senderTitle: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={generationConfig.companyName}
                      onChange={(e) => setGenerationConfig((prev) => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {generatedEmail ? (
              <>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Generated Email</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{generatedEmail.split(" ").length} words</Badge>
                      <Button variant="outline" size="sm" onClick={generateOutreachEmail} disabled={isGenerating}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Subject Line</Label>
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="font-medium"
                      />
                    </div>

                    <div>
                      <Label>Email Content</Label>
                      <Textarea
                        value={generatedEmail}
                        onChange={(e) => setGeneratedEmail(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3">Email Analytics</h4>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-blue-500">8.7/10</div>
                      <p className="text-xs text-muted-foreground">Subject Score</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-500">23%</div>
                      <p className="text-xs text-muted-foreground">Response Rate</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-purple-500">9.1/10</div>
                      <p className="text-xs text-muted-foreground">Readability</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-orange-500">2.3min</div>
                      <p className="text-xs text-muted-foreground">Read Time</p>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Generate an email to see the preview</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {generatedEmail && (
            <>
              <Button variant="outline" onClick={copyToClipboard} className="gap-2 bg-transparent">
                <Copy className="w-4 h-4" />
                {isCopied ? "Copied!" : "Copy"}
              </Button>
              <Button onClick={sendEmail} className="gap-2">
                <Send className="w-4 h-4" />
                Send Email
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
