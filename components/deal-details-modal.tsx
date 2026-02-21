"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Star,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Mail,
  FileText,
  Phone,
  Clock,
  Target,
  BarChart3,
  Activity,
  ExternalLink,
  Linkedin,
  UserCheck,
} from "lucide-react"
import type { Deal } from "@/types/deal"

interface DealDetailsModalProps {
  deal: Deal | null
  isOpen: boolean
  onClose: () => void
  onGenerateOutreach: (deal: Deal) => void
  initialTab?: string
}

export function DealDetailsModal({ deal, isOpen, onClose, onGenerateOutreach, initialTab = "overview" }: DealDetailsModalProps) {
  if (!deal) return null

  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-green-500"
    if (score >= 7) return "text-yellow-500"
    return "text-orange-500"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            {deal.brand} - {deal.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={initialTab} key={initialTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="crm">CRM Integration</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline Tracking</TabsTrigger>
            <TabsTrigger value="engagement">Email Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className={`w-5 h-5 fill-current text-foreground ${getScoreColor(deal.matchScore)}`} />
                  <span className="font-semibold">Match Score</span>
                </div>
                <div className={`font-bold text-primary text-3xl ${getScoreColor(deal.matchScore)}`}>{deal.matchScore}/10</div>
                <p className="text-xs text-muted-foreground mt-1">Based on talent profile and brand alignment</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-foreground" />
                  <span className="font-semibold">Value Range</span>
                </div>
                <div className="font-bold text-primary text-3xl">{deal.valueRange}</div>
                <p className="text-xs text-muted-foreground mt-1">Estimated partnership value</p>
              </Card>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{deal.description}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Brand Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{deal.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry:</span>
                    <span>{deal.industry || "Consumer Goods"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company Size:</span>
                    <span>{deal.companySize || "Large Enterprise"}</span>
                  </div>
                  {deal.website && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Website:</span>
                      <a href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {deal.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timeline
                </h4>
                <div className="space-y-2 text-sm">
                  {deal.deadline && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deadline:</span>
                      <span>{new Date(deal.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Campaign Duration:</span>
                    <span>{deal.duration || "3-6 months"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span>{deal.startDate || "Flexible"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Details */}
            {deal.campaignDetails && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Campaign Details
                </h4>
                <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {deal.campaignDetails.compensationType && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Compensation:</span>
                        <span className="font-medium capitalize">{deal.campaignDetails.compensationType}</span>
                      </div>
                    )}
                    {deal.campaignDetails.platformFocus && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform:</span>
                        <span className="font-medium">{deal.campaignDetails.platformFocus}</span>
                      </div>
                    )}
                    {deal.campaignDetails.deadline && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deadline:</span>
                        <span className="font-medium">{deal.campaignDetails.deadline}</span>
                      </div>
                    )}
                    {deal.campaignDetails.urgency && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Urgency:</span>
                        <span className={`font-medium ${deal.campaignDetails.urgency === "high" ? "text-red-500" : ""}`}>
                          {deal.campaignDetails.urgency.charAt(0).toUpperCase() + deal.campaignDetails.urgency.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {deal.campaignDetails.requirements && deal.campaignDetails.requirements.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Requirements:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {deal.campaignDetails.requirements.map((req, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {deal.sourceUrl && (
                    <a
                      href={deal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View on {deal.source ? deal.source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "source"}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Requirements */}
            {deal.requirements && deal.requirements.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Requirements
                </h4>
                <div className="flex flex-wrap gap-2">
                  {deal.requirements.map((req, idx) => (
                    <Badge key={idx} variant="secondary">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {deal.engagement && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Expected Performance
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="font-semibold text-primary text-3xl">{deal.engagement}%</div>
                    <p className="text-xs text-muted-foreground">Engagement Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-3xl text-primary">{deal.reach || "2.5M"}</div>
                    <p className="text-xs text-muted-foreground">Estimated Reach</p>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-3xl text-primary">{deal.conversions || "3.2%"}</div>
                    <p className="text-xs text-muted-foreground">Conversion Rate</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {deal.tags && deal.tags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {deal.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            )}

            {/* Contact Information */}
            {deal.contact && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Contact Information
                </h4>
                <div className="bg-secondary/50 p-3 rounded-lg text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Contact:</span>
                    <span>{deal.contact.name || "Brand Manager"}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{deal.contact.email || "partnerships@brand.com"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department:</span>
                    <span>{deal.contact.department || "Marketing Partnerships"}</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            {deal.apolloContact ? (
              <>
                <Card className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="text-lg font-semibold">{deal.apolloContact.name}</h3>
                      {deal.apolloContact.title && (
                        <p className="text-sm text-muted-foreground">{deal.apolloContact.title}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{deal.brand}</p>
                      {Number(deal.apolloContact.confidence_score) > 0 && (
                        <Badge variant="outline" className="mt-1 bg-green-500/10 text-green-500 border-green-500/30">
                          Confidence: {Number(deal.apolloContact.confidence_score).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-3">
                  {deal.apolloContact.email && (
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium">{deal.apolloContact.email}</p>
                          </div>
                        </div>
                        <a href={`mailto:${deal.apolloContact.email}`} className="text-primary hover:underline text-sm">
                          Send Email
                        </a>
                      </div>
                    </Card>
                  )}

                  {deal.apolloContact.phone && (
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-sm font-medium">{deal.apolloContact.phone}</p>
                          </div>
                        </div>
                        <a href={`tel:${deal.apolloContact.phone}`} className="text-primary hover:underline text-sm">
                          Call
                        </a>
                      </div>
                    </Card>
                  )}

                  {deal.apolloContact.linkedin_url && (
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Linkedin className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-xs text-muted-foreground">LinkedIn</p>
                            <p className="text-sm font-medium">View Profile</p>
                          </div>
                        </div>
                        <a href={deal.apolloContact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </Card>
                  )}
                </div>

                {!deal.apolloContact.email && !deal.apolloContact.phone && !deal.apolloContact.linkedin_url && (
                  <Card className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Contact found but no direct contact details available.
                    </p>
                  </Card>
                )}
              </>
            ) : deal.contact ? (
              <Card className="p-5">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Contact Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{deal.contact.name || "Brand Manager"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{deal.contact.email || "partnerships@brand.com"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department:</span>
                    <span>{deal.contact.department || "Marketing Partnerships"}</span>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <UserCheck className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No contact information available yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use "Find partnership contact" on the deal card to search for contacts.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="crm" className="space-y-6">
            {deal.crmData ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Account Management
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Manager:</span>
                        <span className="font-medium">{deal.crmData.accountManager}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deal Stage:</span>
                        <Badge variant="outline">{deal.crmData.dealStage}</Badge>
                      </div>
                      {deal.crmData.assignedTo && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Assigned To:</span>
                          <span>{deal.crmData.assignedTo}</span>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Activity Timeline
                    </h4>
                    <div className="space-y-2 text-sm">
                      {deal.crmData.lastContact && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Contact:</span>
                          <span>{new Date(deal.crmData.lastContact).toLocaleDateString()}</span>
                        </div>
                      )}
                      {deal.crmData.nextFollowUp && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Next Follow-up:</span>
                          <span className="font-medium text-orange-500">
                            {new Date(deal.crmData.nextFollowUp).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Contact History
                  </h4>
                  <div className="space-y-2">
                    {deal.crmData.contactHistory.map((contact, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {contact.type === "email" && <Mail className="w-4 h-4 text-blue-500" />}
                            {contact.type === "call" && <Phone className="w-4 h-4 text-green-500" />}
                            {contact.type === "meeting" && <Users className="w-4 h-4 text-purple-500" />}
                            {contact.type === "note" && <FileText className="w-4 h-4 text-gray-500" />}
                            <div>
                              <p className="text-sm font-medium">{contact.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(contact.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {contact.outcome && (
                            <Badge variant="outline" className="text-xs">
                              {contact.outcome}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <Card className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No CRM data available for this deal</p>
                <Button variant="outline" className="mt-2 bg-transparent">
                  Connect to CRM
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6">
            {deal.pipelineData ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-500">{deal.pipelineData.probability}%</div>
                    <p className="text-sm text-muted-foreground">Close Probability</p>
                    <Progress value={deal.pipelineData.probability} className="mt-2 h-2" />
                  </Card>

                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      ${(deal.pipelineData.dealValue / 1000).toFixed(0)}K
                    </div>
                    <p className="text-sm text-muted-foreground">Deal Value</p>
                  </Card>

                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-500">{deal.pipelineData.daysInStage}</div>
                    <p className="text-sm text-muted-foreground">Days in Stage</p>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Pipeline Status
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Stage:</span>
                        <Badge variant="outline">{deal.pipelineData.stage}</Badge>
                      </div>
                      {deal.pipelineData.expectedCloseDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expected Close:</span>
                          <span>{new Date(deal.pipelineData.expectedCloseDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {deal.pipelineData.lastActivity && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Activity:</span>
                          <span>{deal.pipelineData.lastActivity}</span>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Next Actions
                    </h4>
                    <div className="space-y-2 text-sm">
                      {deal.pipelineData.nextAction && (
                        <div className="p-2 bg-secondary/50 rounded">
                          <p className="font-medium">{deal.pipelineData.nextAction}</p>
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Schedule Follow-up
                      </Button>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Update Stage
                      </Button>
                    </div>
                  </Card>
                </div>
              </>
            ) : (
              <Card className="p-6 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No pipeline data available for this deal</p>
                <Button variant="outline" className="mt-2 bg-transparent">
                  Initialize Pipeline Tracking
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            {deal.emailTracking ? (
              <>
                <div className="grid grid-cols-5 gap-4">
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-500">{deal.emailTracking.sent}</div>
                    <p className="text-sm text-muted-foreground">Emails Sent</p>
                  </Card>

                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-500">{deal.emailTracking.opened}</div>
                    <p className="text-sm text-muted-foreground">Opened</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {deal.emailTracking.sent > 0
                        ? Math.round((deal.emailTracking.opened / deal.emailTracking.sent) * 100)
                        : 0}
                      % rate
                    </p>
                  </Card>

                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-500">{deal.emailTracking.clicked}</div>
                    <p className="text-sm text-muted-foreground">Clicked</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {deal.emailTracking.opened > 0
                        ? Math.round((deal.emailTracking.clicked / deal.emailTracking.opened) * 100)
                        : 0}
                      % CTR
                    </p>
                  </Card>

                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-500">{deal.emailTracking.replied}</div>
                    <p className="text-sm text-muted-foreground">Replied</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {deal.emailTracking.sent > 0
                        ? Math.round((deal.emailTracking.replied / deal.emailTracking.sent) * 100)
                        : 0}
                      % rate
                    </p>
                  </Card>

                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-500">{deal.emailTracking.bounced}</div>
                    <p className="text-sm text-muted-foreground">Bounced</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {deal.emailTracking.sent > 0
                        ? Math.round((deal.emailTracking.bounced / deal.emailTracking.sent) * 100)
                        : 0}
                      % rate
                    </p>
                  </Card>
                </div>

                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Engagement Score
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={deal.emailTracking.engagementScore} className="h-3" />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{deal.emailTracking.engagementScore}/100</div>
                      <p className="text-xs text-muted-foreground">Engagement Score</p>
                    </div>
                  </div>
                  {deal.emailTracking.lastEmailDate && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last email sent: {new Date(deal.emailTracking.lastEmailDate).toLocaleDateString()}
                    </p>
                  )}
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    View Email History
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    Schedule Follow-up
                  </Button>
                  <Button className="flex-1">Send Email</Button>
                </div>
              </>
            ) : (
              <Card className="p-6 text-center">
                <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No email engagement data available</p>
                <Button variant="outline" className="mt-2 bg-transparent">
                  Start Email Campaign
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onGenerateOutreach(deal)} className="gap-2 text-background">
            <Mail className="w-4 h-4" />
            Generate Outreach
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
