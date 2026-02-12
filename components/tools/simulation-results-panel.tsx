"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  GitBranch,
  ImageIcon,
  Volume2,
  FileVideo,
  Zap,
  Brain,
  Target,
} from "lucide-react"
import { useState } from "react"
import { TalentSelector } from "../talent-selector"
import type { TalentProfile } from "@/types/talent"

interface SimulationResultsPanelProps {
  selectedTalent?: TalentProfile
  onTalentChange: (talent: TalentProfile) => void
  files: any[]
  onFilesChange: (files: any[]) => void
}

const mockDualPathScenarios = [
  {
    id: "path-comparison-1",
    pathA: {
      name: "Conservative Growth",
      strategy: "Steady brand partnerships with established companies",
      projectedRevenue: "$2.4M",
      timeline: "36 months",
      riskLevel: "Low",
      confidence: 0.89,
      keyMilestones: ["Nike partnership (Month 6)", "Gatorade deal (Month 12)", "Under Armour extension (Month 24)"],
      outcomes: { best: "$3.1M", expected: "$2.4M", worst: "$1.9M" },
    },
    pathB: {
      name: "Aggressive Expansion",
      strategy: "High-risk, high-reward emerging brand partnerships",
      projectedRevenue: "$4.2M",
      timeline: "36 months",
      riskLevel: "High",
      confidence: 0.64,
      keyMilestones: ["Crypto brand launch (Month 3)", "Tech startup series (Month 8)", "Global expansion (Month 18)"],
      outcomes: { best: "$6.8M", expected: "$4.2M", worst: "$1.2M" },
    },
    recommendation: "pathA",
    reasoning: "Conservative path offers better risk-adjusted returns with 89% confidence vs 64%",
  },
  {
    id: "path-comparison-2",
    pathA: {
      name: "Traditional Media Focus",
      strategy: "TV commercials, print ads, and traditional endorsements",
      projectedRevenue: "$1.8M",
      timeline: "24 months",
      riskLevel: "Medium",
      confidence: 0.82,
      keyMilestones: ["Super Bowl commercial (Month 8)", "Magazine covers (Month 12)", "Billboard campaign (Month 18)"],
      outcomes: { best: "$2.3M", expected: "$1.8M", worst: "$1.4M" },
    },
    pathB: {
      name: "Digital-First Strategy",
      strategy: "Social media, influencer collaborations, and digital content",
      projectedRevenue: "$3.6M",
      timeline: "24 months",
      riskLevel: "Medium",
      confidence: 0.91,
      keyFactors: ["Viral content potential", "Younger demographic reach", "Lower production costs"],
      keyMilestones: ["TikTok partnership (Month 2)", "YouTube series launch (Month 6)", "Podcast network (Month 12)"],
      outcomes: { best: "$4.9M", expected: "$3.6M", worst: "$2.1M" },
    },
    recommendation: "pathB",
    reasoning: "Digital strategy shows higher ROI and confidence with better demographic alignment",
  },
]

const mockMediaScoring = {
  imageAnalysis: [
    {
      id: "img-1",
      filename: "athlete-action-shot.jpg",
      type: "Action Photography",
      brandAlignmentScore: 9.2,
      emotionalImpact: 8.7,
      technicalQuality: 9.5,
      marketAppeal: 8.9,
      suggestedUse: "Hero image for athletic wear campaigns",
      demographics: "18-35, Sports enthusiasts",
      estimatedValue: "$15K - $25K per usage",
    },
    {
      id: "img-2",
      filename: "lifestyle-portrait.jpg",
      type: "Lifestyle Portrait",
      brandAlignmentScore: 7.8,
      emotionalImpact: 9.1,
      technicalQuality: 8.4,
      marketAppeal: 8.2,
      suggestedUse: "Luxury brand partnerships, lifestyle campaigns",
      demographics: "25-45, High income",
      estimatedValue: "$8K - $15K per usage",
    },
  ],
  audioAnalysis: [
    {
      id: "audio-1",
      filename: "interview-clip.mp3",
      type: "Interview Audio",
      clarityScore: 9.1,
      emotionalTone: "Confident, Inspiring",
      brandSafety: 9.8,
      marketAppeal: 8.6,
      suggestedUse: "Podcast sponsorships, voice-over work",
      estimatedValue: "$5K - $12K per usage",
    },
  ],
  videoAnalysis: [
    {
      id: "video-1",
      filename: "training-montage.mp4",
      type: "Training Content",
      engagementPotential: 9.4,
      productionQuality: 8.8,
      brandSafety: 9.2,
      viralPotential: 7.9,
      suggestedUse: "Social media campaigns, fitness brand partnerships",
      demographics: "16-34, Fitness enthusiasts",
      estimatedValue: "$20K - $40K per usage",
    },
  ],
}

const mockTimeSeriesData = [
  { month: "Jan 2025", conservative: 180000, aggressive: 150000, actual: null },
  { month: "Feb 2025", conservative: 195000, aggressive: 180000, actual: null },
  { month: "Mar 2025", conservative: 210000, aggressive: 240000, actual: null },
  { month: "Apr 2025", conservative: 225000, aggressive: 320000, actual: null },
  { month: "May 2025", conservative: 240000, aggressive: 420000, actual: null },
  { month: "Jun 2025", conservative: 255000, aggressive: 480000, actual: null },
  { month: "Jul 2025", conservative: 270000, aggressive: 520000, actual: null },
  { month: "Aug 2025", conservative: 285000, aggressive: 580000, actual: null },
  { month: "Sep 2025", conservative: 300000, aggressive: 640000, actual: null },
  { month: "Oct 2025", conservative: 315000, aggressive: 720000, actual: null },
  { month: "Nov 2025", conservative: 330000, aggressive: 800000, actual: null },
  { month: "Dec 2025", conservative: 345000, aggressive: 900000, actual: null },
]

const mockScenarios = [
  {
    id: "scenario-1",
    name: "Exclusive Nike Deal",
    type: "Single Brand",
    duration: "3 years",
    projectedRevenue: "$2.4M",
    confidence: 0.87,
    riskLevel: "Medium",
    outcomes: {
      best: "$3.1M",
      expected: "$2.4M",
      worst: "$1.8M",
    },
  },
  {
    id: "scenario-2",
    name: "Multi-Brand Portfolio",
    type: "Diversified",
    duration: "3 years",
    projectedRevenue: "$3.2M",
    confidence: 0.92,
    riskLevel: "Low",
    outcomes: {
      best: "$4.1M",
      expected: "$3.2M",
      worst: "$2.6M",
    },
  },
  {
    id: "scenario-3",
    name: "Performance-Based Deal",
    type: "Variable",
    duration: "2 years",
    projectedRevenue: "$1.8M",
    confidence: 0.74,
    riskLevel: "High",
    outcomes: {
      best: "$2.9M",
      expected: "$1.8M",
      worst: "$900K",
    },
  },
]

const mockMetrics = [
  { label: "Social Media Growth", current: 2.1, projected: 3.8, unit: "M followers" },
  { label: "Engagement Rate", current: 4.2, projected: 6.1, unit: "%" },
  { label: "Brand Alignment Score", current: 7.8, projected: 8.9, unit: "/10" },
  { label: "Market Value", current: 1.2, projected: 2.1, unit: "M USD" },
]

export function SimulationResultsPanel({
  selectedTalent,
  onTalentChange,
  files,
  onFilesChange,
}: SimulationResultsPanelProps) {
  const [activeScenario, setActiveScenario] = useState("scenario-1")
  const [simulationProgress, setSimulationProgress] = useState(100)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<"scenarios" | "dual-path" | "media-scoring" | "projections">("dual-path")
  const [selectedPathComparison, setSelectedPathComparison] = useState("path-comparison-1")

  const runSimulation = () => {
    setIsRunning(true)
    setSimulationProgress(0)

    const interval = setInterval(() => {
      setSimulationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsRunning(false)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "text-green-500"
      case "medium":
        return "text-yellow-500"
      case "high":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-green-500"
    if (score >= 7) return "text-blue-500"
    if (score >= 5) return "text-yellow-500"
    return "text-red-500"
  }

  const selectedScenario = mockScenarios.find((s) => s.id === activeScenario)
  const selectedComparison = mockDualPathScenarios.find((c) => c.id === selectedPathComparison)

  return (
    <div className="space-y-6">
      {/* File Context Indicator */}
      {files.length > 0 && (
        <div className="p-3 bg-secondary/50 rounded-lg border">
          <p className="text-xs text-muted-foreground">
            Using context from {files.filter((f) => f.status === "completed").length} uploaded files for simulation
            modeling
          </p>
        </div>
      )}

      {/* Talent Context */}
      <TalentSelector
        selectedTalent={selectedTalent}
        onTalentChange={onTalentChange}
        onCreateNew={() => {}}
      />

      {/* Enhanced Simulation Controls */}
      <div>
        <h4 className="text-sm font-medium mb-3">Advanced Simulation Engine</h4>
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Monte Carlo Iterations</span>
              <Badge variant="outline">10,000 runs</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">AI Model Confidence</span>
              <Badge variant="outline" className="gap-1">
                <Brain className="w-3 h-3" />
                94.2%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Time Horizon</span>
              <span className="text-xs text-muted-foreground">36 months with quarterly updates</span>
            </div>
            {isRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progress</span>
                  <span className="text-xs text-muted-foreground">{simulationProgress}%</span>
                </div>
                <Progress value={simulationProgress} className="h-2" />
              </div>
            )}
            <Button onClick={runSimulation} disabled={isRunning} className="w-full gap-2">
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isRunning ? "Running Advanced Simulation..." : "Run Quantum Simulation"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Enhanced Tab Navigation */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Forecasting Engine</h4>
          <div className="flex gap-1">
            <Button
              variant={activeTab === "dual-path" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("dual-path")}
            >
              Dual-Path
            </Button>
            <Button
              variant={activeTab === "scenarios" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("scenarios")}
            >
              Scenarios
            </Button>
            <Button
              variant={activeTab === "media-scoring" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("media-scoring")}
            >
              Media Scoring
            </Button>
            <Button
              variant={activeTab === "projections" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("projections")}
            >
              Projections
            </Button>
          </div>
        </div>

        {activeTab === "dual-path" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">
                Compare two strategic paths with AI-powered outcome modeling
              </p>
            </div>

            <div className="space-y-3">
              {mockDualPathScenarios.map((comparison) => (
                <Card
                  key={comparison.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedPathComparison === comparison.id ? "ring-2 ring-primary" : "hover:bg-secondary/50"
                  }`}
                  onClick={() => setSelectedPathComparison(comparison.id)}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium">Strategic Path Comparison</h5>
                      <Badge variant="outline" className="gap-1">
                        <Target className="w-3 h-3" />
                        Recommended: Path {comparison.recommendation === "pathA" ? "A" : "B"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Path A */}
                      <div className="space-y-2 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <h6 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Path A: {comparison.pathA.name}
                          </h6>
                          <Badge
                            variant={comparison.recommendation === "pathA" ? "default" : "outline"}
                            className="text-xs text-primary-foreground bg-primary border-none"
                          >
                            {Math.round(comparison.pathA.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-background">{comparison.pathA.strategy}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-xs text-background">Revenue:</span>
                            <span className="font-medium text-background">{comparison.pathA.projectedRevenue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-background">Risk:</span>
                            <span className={getRiskColor(comparison.pathA.riskLevel)}>
                              {comparison.pathA.riskLevel}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-background">Timeline:</span>
                            <span className="text-background">{comparison.pathA.timeline}</span>
                          </div>
                        </div>
                      </div>

                      {/* Path B */}
                      <div className="space-y-2 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between">
                          <h6 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                            Path B: {comparison.pathB.name}
                          </h6>
                          <Badge
                            variant={comparison.recommendation === "pathB" ? "default" : "outline"}
                            className="text-xs text-white bg-primary border-none"
                          >
                            {Math.round(comparison.pathB.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-background">{comparison.pathB.strategy}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-background">Revenue:</span>
                            <span className="font-medium text-background">{comparison.pathB.projectedRevenue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-background">Risk:</span>
                            <span className={getRiskColor(comparison.pathB.riskLevel)}>
                              {comparison.pathB.riskLevel}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-background">Timeline:</span>
                            <span className="text-background">{comparison.pathB.timeline}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">AI Recommendation:</p>
                      <p className="text-xs">{comparison.reasoning}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Detailed Path Analysis */}
            {selectedComparison && (
              <Card className="p-4">
                <h5 className="text-sm font-medium mb-3">Milestone Timeline Analysis</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h6 className="text-blue-800 dark:text-blue-200 mb-2 font-bold text-sm">Path A Milestones</h6>
                    <div className="space-y-1">
                      {selectedComparison.pathA.keyMilestones.map((milestone, index) => (
                        <div
                          key={index}
                          className="text-xs p-2 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800 text-background"
                        >
                          {milestone}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h6 className="font-medium text-purple-800 dark:text-purple-200 mb-2 text-sm">Path B Milestones</h6>
                    <div className="space-y-1">
                      {selectedComparison.pathB.keyMilestones.map((milestone, index) => (
                        <div
                          key={index}
                          className="text-xs p-2 bg-purple-100 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-800 text-background"
                        >
                          {milestone}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "scenarios" && (
          <div className="space-y-4">
            <Badge variant="outline">{mockScenarios.length} scenarios analyzed</Badge>
            <div className="space-y-2">
              {mockScenarios.map((scenario) => (
                <Card
                  key={scenario.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    activeScenario === scenario.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setActiveScenario(scenario.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{scenario.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {scenario.type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{scenario.projectedRevenue}</p>
                        <p className="text-xs text-muted-foreground">{scenario.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className={`w-3 h-3 ${getRiskColor(scenario.riskLevel)}`} />
                        <span>{scenario.riskLevel} Risk</span>
                      </div>
                      <span>{Math.round(scenario.confidence * 100)}% confidence</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Detailed Forecast */}
            {selectedScenario && (
              <div>
                <h4 className="text-sm font-medium mb-3">Outcome Distribution</h4>
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Best Case</p>
                        <p className="text-sm font-medium text-green-500">{selectedScenario.outcomes.best}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expected</p>
                        <p className="text-sm font-medium">{selectedScenario.outcomes.expected}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Worst Case</p>
                        <p className="text-sm font-medium text-red-500">{selectedScenario.outcomes.worst}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === "media-scoring" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-purple-500" />
              <p className="text-xs text-muted-foreground">
                AI-powered analysis of media assets for market value and brand alignment
              </p>
            </div>

            {/* Image Analysis */}
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Image Analysis
              </h5>
              <div className="space-y-2">
                {mockMediaScoring.imageAnalysis.map((img) => (
                  <Card key={img.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{img.filename}</span>
                        <Badge variant="outline" className="text-xs">
                          {img.type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex justify-between">
                          <span>Brand Alignment:</span>
                          <span className={`font-medium ${getScoreColor(img.brandAlignmentScore)}`}>
                            {img.brandAlignmentScore}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Emotional Impact:</span>
                          <span className={`font-medium ${getScoreColor(img.emotionalImpact)}`}>
                            {img.emotionalImpact}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Technical Quality:</span>
                          <span className={`font-medium ${getScoreColor(img.technicalQuality)}`}>
                            {img.technicalQuality}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Market Appeal:</span>
                          <span className={`font-medium ${getScoreColor(img.marketAppeal)}`}>
                            {img.marketAppeal}/10
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Suggested Use: {img.suggestedUse}</p>
                        <p className="text-xs text-muted-foreground">Target: {img.demographics}</p>
                        <p className="text-xs font-medium text-green-600">{img.estimatedValue}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Audio Analysis */}
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Audio Analysis
              </h5>
              <div className="space-y-2">
                {mockMediaScoring.audioAnalysis.map((audio) => (
                  <Card key={audio.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{audio.filename}</span>
                        <Badge variant="outline" className="text-xs">
                          {audio.type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex justify-between">
                          <span>Clarity Score:</span>
                          <span className={`font-medium ${getScoreColor(audio.clarityScore)}`}>
                            {audio.clarityScore}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Brand Safety:</span>
                          <span className={`font-medium ${getScoreColor(audio.brandSafety)}`}>
                            {audio.brandSafety}/10
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Tone: {audio.emotionalTone}</p>
                        <p className="text-xs text-muted-foreground">Suggested Use: {audio.suggestedUse}</p>
                        <p className="text-xs font-medium text-green-600">{audio.estimatedValue}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Video Analysis */}
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileVideo className="w-4 h-4" />
                Video Analysis
              </h5>
              <div className="space-y-2">
                {mockMediaScoring.videoAnalysis.map((video) => (
                  <Card key={video.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{video.filename}</span>
                        <Badge variant="outline" className="text-xs">
                          {video.type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex justify-between">
                          <span>Engagement Potential:</span>
                          <span className={`font-medium ${getScoreColor(video.engagementPotential)}`}>
                            {video.engagementPotential}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Production Quality:</span>
                          <span className={`font-medium ${getScoreColor(video.productionQuality)}`}>
                            {video.productionQuality}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Brand Safety:</span>
                          <span className={`font-medium ${getScoreColor(video.brandSafety)}`}>
                            {video.brandSafety}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Viral Potential:</span>
                          <span className={`font-medium ${getScoreColor(video.viralPotential)}`}>
                            {video.viralPotential}/10
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Suggested Use: {video.suggestedUse}</p>
                        <p className="text-xs text-muted-foreground">Target: {video.demographics}</p>
                        <p className="text-xs font-medium text-green-600">{video.estimatedValue}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "projections" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-green-500" />
              <p className="text-xs text-muted-foreground">Monthly revenue projections with confidence intervals</p>
            </div>

            <Card className="p-4">
              <h5 className="text-sm font-medium mb-3">Revenue Projection Timeline</h5>
              <div className="space-y-2">
                {mockTimeSeriesData.slice(0, 6).map((dataPoint, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                    <span className="text-xs font-medium">{dataPoint.month}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>Conservative: ${(dataPoint.conservative / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        <span>Aggressive: ${(dataPoint.aggressive / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>12-Month Projection Range:</span>
                  <span className="font-medium">$2.1M - $5.4M</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>Confidence Interval:</span>
                  <span>85% - 92%</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Key Metrics Projection */}
      <div>
        <h4 className="text-sm font-medium mb-3">Performance Metrics</h4>
        <div className="space-y-2">
          {mockMetrics.map((metric, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{metric.label}</span>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {metric.current} → {metric.projected} {metric.unit}
                    </span>
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
