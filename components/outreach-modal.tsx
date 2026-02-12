"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Copy, Send, RefreshCw, Mail, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import { OutreachGenerationSystem } from "./outreach-generation-system"
import type { Deal } from "@/types/deal"
import type { TalentProfile } from "@/types/talent"

interface OutreachModalProps {
  deal: Deal | null
  isOpen: boolean
  onClose: () => void
  talentName?: string
  talent?: TalentProfile
}

export function OutreachModal({ deal, isOpen, onClose, talentName = "John Doe", talent }: OutreachModalProps) {
  const [outreachText, setOutreachText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [useAdvancedSystem, setUseAdvancedSystem] = useState(true)

  const generateOutreach = async () => {
    if (!deal) return

    setIsGenerating(true)

    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const generatedText = `Subject: Partnership Opportunity - ${deal.brand} x ${talentName}

Dear ${deal.contact?.name || "Partnership Team"},

I hope this email finds you well. I'm reaching out regarding an exciting partnership opportunity between ${deal.brand} and ${talentName}.

${talentName} is a ${deal.category.toLowerCase()} talent with a strong alignment to ${deal.brand}'s brand values and target audience. Based on our analysis, this partnership has a ${deal.matchScore}/10 match score, indicating excellent potential for mutual success.

Key Highlights:
• Strong audience alignment with ${deal.brand}'s target demographic
• Proven track record in ${deal.category.toLowerCase()} partnerships
• Expected engagement rate of ${deal.engagement || "4.2"}%
• Estimated reach of ${deal.reach || "2.5M"} across all platforms

${talentName} would be excited to collaborate on ${deal.title}, bringing authentic storytelling and genuine brand advocacy to the partnership. We believe this collaboration could deliver significant value within your ${deal.valueRange} budget range.

I'd love to schedule a brief call to discuss how we can create a compelling campaign that drives real results for ${deal.brand}. Are you available for a 15-minute conversation this week?

Looking forward to exploring this opportunity together.

Best regards,
Sarah M.
Talent Manager
Hyper Talent Agency

P.S. I've attached ${talentName}'s media kit and recent performance metrics for your review.`

    setOutreachText(generatedText)
    setIsGenerating(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outreachText)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const sendEmail = () => {
    const subject = encodeURIComponent(`Partnership Opportunity - ${deal?.brand} x ${talentName}`)
    const body = encodeURIComponent(outreachText)
    const mailto = `mailto:${deal?.contact?.email || "partnerships@brand.com"}?subject=${subject}&body=${body}`
    window.open(mailto)
  }

  const handleEmailSent = (deal: Deal, email: string) => {
    // Here you could update deal status, log the outreach, etc.
  }

  useEffect(() => {
    if (isOpen && deal) {
      generateOutreach()
    }
  }, [isOpen, deal])

  if (!deal) return null

  // Use advanced system if talent profile is available
  if (useAdvancedSystem && talent) {
    return (
      <OutreachGenerationSystem
        deal={deal}
        talent={talent}
        isOpen={isOpen}
        onClose={onClose}
        onEmailSent={handleEmailSent}
      />
    )
  }

  // Fallback to simple modal
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Outreach Email - {deal.brand}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Deal Summary */}
          <div className="bg-secondary/50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{deal.title}</span>
              <Badge className="text-background" variant="default">Match: {deal.matchScore}/10</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{deal.description}</p>
          </div>

          {/* Generated Email */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Generated Email</label>
              <div className="flex items-center gap-2">
                {isGenerating && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    Generating...
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateOutreach}
                  disabled={isGenerating}
                  className="gap-1 bg-transparent"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              </div>
            </div>

            <Textarea
              value={outreachText}
              onChange={(e) => setOutreachText(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="AI-generated outreach email will appear here..."
            />
          </div>

          {/* Email Stats */}
          {outreachText && (
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-medium">{outreachText.split(" ").length}</div>
                <div className="text-muted-foreground">Words</div>
              </div>
              <div>
                <div className="font-medium">{outreachText.length}</div>
                <div className="text-muted-foreground">Characters</div>
              </div>
              <div>
                <div className="font-medium">~{Math.ceil(outreachText.split(" ").length / 200)}min</div>
                <div className="text-muted-foreground">Read Time</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={copyToClipboard} disabled={!outreachText} className="gap-2 bg-transparent">
            <Copy className="w-4 h-4" />
            {isCopied ? "Copied!" : "Copy"}
          </Button>
          <Button onClick={sendEmail} disabled={!outreachText} className="gap-2 text-background">
            <Send className="w-4 h-4" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
