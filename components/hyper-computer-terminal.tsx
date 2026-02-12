"use client"
import { Button } from "@/components/ui/button"
import type React from "react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Loader2,
  ChevronDown,
  ChevronRight,
  FileText,
  Database,
  Globe,
  MessageSquare,
  Gamepad2,
  Play,
  Bot,
  AlertCircle,
} from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import type { TalentProfile, UploadedFile } from "@/types/talent"
import type { ToolType } from "@/app/page"
import { apiClient } from "@/services/api-client"

interface AgentStep {
  id: string
  agent: string
  status: "running" | "completed" | "error"
  message: string
  sources?: string[]
  timestamp: string
  expanded?: boolean
  data?: any
}

const getQuickPrompts = (tool: ToolType): string[] => {
  switch (tool) {
    case "chat":
      return [
        "What deals do I have?",
        "Tell me about my highest scoring deal",
        "Draft a partnership proposal for Nike",
        "Create a media kit template",
      ]
    case "crawler":
      return [
        "Scan NIL registries for new opportunities",
        "Monitor competitor brand campaigns",
        "Find emerging brand partnerships",
        "Track industry sentiment changes",
      ]
    case "deal-hunter":
      return [
        "Find brand deals for a professional athlete",
        "Analyze uploaded media kit for partnership opportunities",
        "Search for endorsement deals in sports nutrition",
        "Generate outreach email for Nike partnership",
      ]
    case "gameplan":
      return [
        "Find naming rights opportunities",
        "Calculate ROI for stadium sponsorship",
        "Match brands to venue properties",
        "Generate partnership packages",
      ]
    case "simulation":
      return [
        "Model 3-year endorsement deal outcomes",
        "Simulate brand alignment impact",
        "Forecast social media growth",
        "Compare exclusive vs multi-brand strategies",
      ]
    default:
      return []
  }
}

const getToolConfig = (tool: ToolType) => {
  switch (tool) {
    case "chat":
      return {
        title: "AI Chat Terminal",
        subtitle: "Strategic conversations with your AI agency",
        agents: [
          { name: "prompt_interpreter", description: "Analyzes user intent and context" },
          { name: "brand_strategist", description: "Develops partnership strategies" },
          { name: "contract_composer", description: "Creates legal documents and terms" },
          { name: "calendar_sync", description: "Manages scheduling and deadlines" },
        ],
      }
    case "crawler":
      return {
        title: "Web Crawler Terminal",
        subtitle: "Market intelligence on autopilot",
        agents: [
          { name: "opportunity_radar", description: "Scans for new partnership opportunities" },
          { name: "pr_scanner", description: "Monitors media and sentiment" },
          { name: "campaign_detector", description: "Identifies active brand campaigns" },
          { name: "scraping_agent", description: "Extracts structured data from sources" },
        ],
      }
    case "deal-hunter":
      return {
        title: "Deal Hunter Terminal",
        subtitle: "Find, negotiate, and close automatically",
        agents: [
          { name: "file_processor", description: "Processes uploaded talent files" },
          { name: "profile_analyzer", description: "Analyzes talent metrics and fit" },
          { name: "deal_matcher", description: "Matches talent to brand opportunities" },
          { name: "outreach_composer", description: "Creates personalized outreach" },
        ],
      }
    case "gameplan":
      return {
        title: "GamePlan X Terminal",
        subtitle: "The autonomous sponsorship exchange",
        agents: [
          { name: "brand_strategy", description: "Analyzes brand campaign objectives" },
          { name: "match_engine", description: "Matches brands to optimal opportunities" },
          { name: "roi_simulator", description: "Calculates partnership ROI projections" },
          { name: "marketplace_composer", description: "Creates marketplace listings" },
        ],
      }
    case "simulation":
      return {
        title: "Simulation Terminal",
        subtitle: "Model outcomes, optimize futures",
        agents: [
          { name: "simulation_planner", description: "Sets up forecasting models" },
          { name: "revenue_forecaster", description: "Predicts financial outcomes" },
          { name: "talent_persona", description: "Models talent behavior patterns" },
          { name: "media_effectiveness", description: "Measures campaign impact" },
        ],
      }
    default:
      return {
        title: "Hyper Computer Terminal",
        subtitle: "AI-powered talent management",
        agents: [],
      }
  }
}

interface HyperComputerTerminalProps {
  selectedTalent?: TalentProfile
  onDealsFound?: (deals: any[]) => void
  activeTool: ToolType
  files?: UploadedFile[]
}

export function HyperComputerTerminal({
  selectedTalent,
  onDealsFound,
  activeTool,
  files = [],
}: HyperComputerTerminalProps) {
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [messages, setMessages] = useState<AgentStep[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionInitRef = useRef<string | null>(null)

  const toolConfig = getToolConfig(activeTool)
  const quickPrompts = getQuickPrompts(activeTool)

  // Start chat session when talent is selected
  const startChatSession = useCallback(async (talentId: string, talentName: string) => {
    // Prevent duplicate session starts
    if (sessionInitRef.current === talentId) return
    sessionInitRef.current = talentId

    setSessionError(null)
    setIsConnected(false)

    try {
      const data = await apiClient.startChatSession({
        talent_id: talentId,
        talent_name: talentName,
      }) as any
      setSessionId(data.session_id)
      setIsConnected(true)

      // Add welcome message
      const dealsLoaded = data.deals_loaded || 0
      const contextParts: string[] = []
      if (data.files_loaded > 0) contextParts.push(`${data.files_loaded} documents`)
      if (dealsLoaded > 0) contextParts.push(`${dealsLoaded} deals from history`)
      const contextStr = contextParts.length > 0 ? contextParts.join(" and ") : "no documents"
      const fallbackMessage = `Connected! I have access to ${contextStr} for ${data.talent_name}.`

      const welcomeMessage: AgentStep = {
        id: `welcome-${Date.now()}`,
        agent: "system",
        status: "completed",
        message: data.message || fallbackMessage,
        timestamp: new Date().toISOString(),
        expanded: true,
        data: {
          files_loaded: data.files_loaded,
          deals_loaded: dealsLoaded,
          categories: data.categories,
          talent_name: data.talent_name
        }
      }
      setMessages([welcomeMessage])
    } catch (error) {
      console.error('Failed to start chat session:', error)
      setSessionError('Failed to connect to AI chat. Please try again.')
      sessionInitRef.current = null
    }
  }, [])

  // Effect to start session when talent changes
  // Connect to backend for any tool type when a talent is selected
  useEffect(() => {
    if (selectedTalent?.id) {
      startChatSession(selectedTalent.id, selectedTalent.name)
    }
  }, [selectedTalent?.id, startChatSession])

  useEffect(() => {
    setMessages([])
    setInput("")
    setIsStreaming(false)
    setSessionId(null)
    setIsConnected(false)
    setSessionError(null)
    sessionInitRef.current = null
  }, [activeTool])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const query = input.trim()
    setInput("")
    setIsStreaming(true)

    // Add user message
    const userMessage: AgentStep = {
      id: `user-${Date.now()}`,
      agent: "user",
      status: "completed",
      message: query,
      timestamp: new Date().toISOString(),
      expanded: false,
    }
    setMessages((prev) => [...prev, userMessage])

    // If we have a session, use real API
    if (sessionId && isConnected) {
      try {
        // Add processing indicator
        const processingStep: AgentStep = {
          id: `processing-${Date.now()}`,
          agent: "profile_analyzer",
          status: "running",
          message: "Analyzing your request with uploaded documents...",
          timestamp: new Date().toISOString(),
          expanded: false,
        }
        setMessages((prev) => [...prev, processingStep])

        const data = await apiClient.sendChatMessage(sessionId, query) as any

        // Remove processing indicator and add real response
        setMessages((prev) => {
          const filtered = prev.filter(m => !m.id.startsWith('processing-'))

          const responseStep: AgentStep = {
            id: `response-${Date.now()}`,
            agent: data.intent === 'search_deals' ? 'deal_matcher' : 'profile_analyzer',
            status: "completed",
            message: data.message,
            timestamp: new Date().toISOString(),
            expanded: true,
            data: {
              intent: data.intent,
              deals_found: data.deals_found,
              deals: data.deals,
              knowledge_base_used: true
            }
          }

          return [...filtered, responseStep]
        })

        // Pass deals to parent if found
        if (data.deals && onDealsFound) {
          onDealsFound(data.deals)
        }
      } catch (error) {
        console.error('Chat error:', error)
        setMessages((prev) => {
          const filtered = prev.filter(m => !m.id.startsWith('processing-'))
          return [...filtered, {
            id: `error-${Date.now()}`,
            agent: "system",
            status: "error",
            message: "Failed to get response. Please try again.",
            timestamp: new Date().toISOString(),
            expanded: true,
          }]
        })
      }
    } else {
      // Fallback to mock mode for other tools or when not connected
      await runMockChat(query)
    }

    setIsStreaming(false)
  }

  const runMockChat = async (query: string) => {
    const completedFiles = files.filter((f) => f.status === "completed")
    const fileNames = completedFiles.map((f) => f.name)

    const mockSteps: Omit<AgentStep, "id">[] = [
      {
        agent: "profile_analyzer",
        status: "running" as const,
        message: `Analyzing request${completedFiles.length > 0 ? " with uploaded files" : ""}...`,
        sources: completedFiles.length > 0 ? fileNames : ["talent_profile"],
        timestamp: new Date().toISOString(),
      },
      {
        agent: "deal_matcher",
        status: "completed" as const,
        message: `Analysis complete. ${completedFiles.length > 0 ? `Used context from ${fileNames.join(", ")}.` : "Using default profile."}`,
        sources: ["market_data", ...fileNames],
        timestamp: new Date().toISOString(),
        data: {
          mock_mode: true,
          file_context_used: completedFiles.length > 0,
        },
      },
    ]

    for (let i = 0; i < mockSteps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const step: AgentStep = {
        ...mockSteps[i],
        id: `step-${Date.now()}-${i}`,
        expanded: i === mockSteps.length - 1,
      }

      setMessages((prev) => {
        const newMessages = [...prev]
        if (i > 0 && newMessages.length > 0) {
          const lastIndex = newMessages.length - 1
          if (newMessages[lastIndex].agent !== "user") {
            newMessages[lastIndex] = { ...newMessages[lastIndex], status: "completed" }
          }
        }
        return [...newMessages, step]
      })
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
  }

  const toggleStepExpansion = (stepId: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === stepId ? { ...msg, expanded: !msg.expanded } : msg)))
  }

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case "file_processor":
      case "prompt_interpreter":
        return <FileText className="w-4 h-4" />
      case "profile_analyzer":
      case "brand_strategist":
      case "brand_strategy":
        return <Database className="w-4 h-4" />
      case "deal_matcher":
      case "opportunity_radar":
      case "campaign_detector":
        return <Globe className="w-4 h-4" />
      case "contract_composer":
      case "outreach_composer":
        return <MessageSquare className="w-4 h-4" />
      case "match_engine":
      case "marketplace_composer":
        return <Gamepad2 className="w-4 h-4" />
      case "simulation_planner":
      case "revenue_forecaster":
      case "roi_simulator":
        return <Play className="w-4 h-4" />
      default:
        return <Bot className="w-4 h-4" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-background max-w-[400px] md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
      {/* Chat Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <h2 className="text-2xl font-semibold mb-2">{toolConfig.title}</h2>
              <p className="text-muted-foreground mb-6">{toolConfig.subtitle}</p>

              <div className="mb-6 p-4 bg-secondary/30 rounded-lg border max-w-full mx-auto">
                <p className="text-sm font-medium mb-3">Active AI Agents:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {toolConfig.agents.map((agent, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-background/50 rounded text-left">
                      {getAgentIcon(agent.name)}
                      <div>
                        <p className="text-xs font-medium capitalize">{agent.name.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{agent.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {files.filter((f) => f.status === "completed").length > 0 && (
                <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20 max-w-full md:max-w-md mx-auto">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    ✓ Ready to analyze {files.filter((f) => f.status === "completed").length} uploaded files
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    File context will enhance all AI agent responses
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Quick prompts:</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-full">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickPrompt(prompt)}
                      className="text-xs"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.agent === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[85%] md:max-w-2xl lg:max-w-3xl">
                    {message.message}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {message.status === "running" ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      getAgentIcon(message.agent)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium capitalize">{message.agent.replace("_", " ")}</span>
                      <Badge variant={message.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {message.status}
                      </Badge>
                      {message.data?.deals_found && (
                        <Badge variant="outline" className="text-xs">
                          {message.data.deals_found} deals found
                        </Badge>
                      )}
                      {message.data?.file_context_used && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                          📁 Using file context
                        </Badge>
                      )}
                      {message.data?.personalized && (
                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                          🎯 Personalized
                        </Badge>
                      )}
                      {message.data?.confidence_level && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20"
                        >
                          {Math.round(message.data.confidence_level * 100)}% confidence
                        </Badge>
                      )}
                    </div>

                    <div className="bg-card border rounded-lg">
                      <button
                        onClick={() => toggleStepExpansion(message.id)}
                        className="w-full p-3 text-left flex items-center justify-between hover:bg-accent/50 transition-colors"
                      >
                        <span className="text-sm">{message.message}</span>
                        {message.expanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>

                      {message.expanded && (
                        <div className="px-3 pb-3 border-t border-border">
                          <div className="pt-2 space-y-2">
                            {message.sources && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                                <div className="flex flex-wrap gap-1">
                                  {message.sources.map((source, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {source}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {message.data && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Details:</p>
                                <pre className="text-xs bg-secondary p-2 rounded font-mono">
                                  {JSON.stringify(message.data, null, 2)}
                                </pre>
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-border p-4 bg-black border-none border-t-[0]">
        {sessionError && (
          <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">{sessionError}</span>
            {selectedTalent && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto text-xs"
                onClick={() => startChatSession(selectedTalent.id, selectedTalent.name)}
              >
                Retry
              </Button>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isConnected
                  ? `Ask about ${selectedTalent?.name || 'talent'}'s documents and deals...`
                  : `Ask ${toolConfig.title.replace(" Terminal", "")} about talent opportunities...`
              }
              className="flex-1"
              disabled={isStreaming}
            />
            <Button type="submit" disabled={isStreaming || !input.trim()}>
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex items-center justify-center mt-2 gap-2">
            {isConnected ? (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                Connected to Knowledge Base
              </Badge>
            ) : selectedTalent ? (
              <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                Connecting...
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Mock Mode - Select a talent to enable AI
              </Badge>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
