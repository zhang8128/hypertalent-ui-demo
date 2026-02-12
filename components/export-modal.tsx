"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FileSpreadsheet, FileText, Download, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"
import { ExportService } from "@/services/export-service"
import type { Deal } from "@/types/deal"
import type { TalentProfile, UploadedFile } from "@/types/talent"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  deals: Deal[]
  talent?: TalentProfile
  files: UploadedFile[]
}

export function ExportModal({ isOpen, onClose, deals, talent, files }: ExportModalProps) {
  const [exportStatus, setExportStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const exportService = ExportService.getInstance()

  const handleCSVExport = () => {
    const exportData = {
      talent,
      deals,
      files: files.filter((f) => f.status === "completed"),
      exportedAt: new Date().toISOString(),
      exportedBy: talent?.name || "User",
    }

    exportService.exportToCSV(exportData)
    setExportStatus({
      type: "success",
      message: "CSV file downloaded successfully!",
    })
  }

  const handleJSONExport = () => {
    const exportData = {
      talent,
      deals,
      files: files.filter((f) => f.status === "completed"),
      exportedAt: new Date().toISOString(),
      exportedBy: talent?.name || "User",
    }

    exportService.exportToJSON(exportData)
    setExportStatus({
      type: "success",
      message: "JSON file downloaded successfully!",
    })
  }

  const totalValue = deals.reduce((sum, deal) => {
    const value = Number.parseInt(deal.valueRange.replace(/[^0-9]/g, "")) || 0
    return sum + value
  }, 0)

  const avgScore = deals.length > 0 ? deals.reduce((sum, deal) => sum + deal.matchScore, 0) / deals.length : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Deals
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Summary */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Export Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Talent:</span>
                <p className="font-medium">{talent?.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Deals:</span>
                <p className="font-medium">{deals.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Avg. Match Score:</span>
                <p className="font-medium">{avgScore.toFixed(1)}/10</p>
              </div>
              <div>
                <span className="text-muted-foreground">Est. Total Value:</span>
                <p className="font-medium">${totalValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Export Options */}
          <div className="space-y-3">
            <h3 className="font-semibold">Export Options</h3>

            {/* Google Sheets */}
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Google Sheets</h4>
                    <p className="text-sm text-muted-foreground">
                      Export to a collaborative spreadsheet with formatting
                    </p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Collaborative
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Formatted
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button onClick={handleCSVExport} className="gap-2">
                  Export
                </Button>
              </div>
            </Card>

            {/* CSV */}
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">CSV File</h4>
                    <p className="text-sm text-muted-foreground">
                      Download as comma-separated values for Excel or other tools
                    </p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Universal
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Offline
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" onClick={handleCSVExport} className="gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </Card>

            {/* JSON */}
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">JSON File</h4>
                    <p className="text-sm text-muted-foreground">
                      Raw data export for developers and advanced analysis
                    </p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Complete Data
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        API Ready
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" onClick={handleJSONExport} className="gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </Card>
          </div>

          {/* Status Message */}
          {exportStatus.type && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                exportStatus.type === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
              }`}
            >
              {exportStatus.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm">{exportStatus.message}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
