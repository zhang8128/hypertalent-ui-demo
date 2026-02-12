"use client"

import type { Deal } from "@/types/deal"
import type { TalentProfile, UploadedFile } from "@/types/talent"

interface ExportData {
  talent?: TalentProfile
  deals: Deal[]
  files: UploadedFile[]
  exportedAt: string
  exportedBy?: string
}

export class ExportService {
  private static instance: ExportService

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService()
    }
    return ExportService.instance
  }

  exportToCSV(data: ExportData): void {
    const csvContent = this.generateCSV(data)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `deals_export_${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  exportToJSON(data: ExportData): void {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `deals_export_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  private generateCSV(data: ExportData): string {
    const headers = [
      "Brand",
      "Title",
      "Category",
      "Value Range",
      "Match Score",
      "Description",
      "Tags",
      "Deadline",
      "Requirements",
      "Engagement",
      "Reach",
      "Status",
      "Contact Name",
      "Contact Email",
      "Created At",
    ]

    const rows = data.deals.map((deal) => [
      deal.brand,
      deal.title,
      deal.category,
      deal.valueRange,
      deal.matchScore.toString(),
      deal.description,
      deal.tags.join("; "),
      deal.deadline || "",
      deal.requirements?.join("; ") || "",
      deal.engagement?.toString() || "",
      deal.reach || "",
      deal.status || "new",
      deal.contact?.name || "",
      deal.contact?.email || "",
      deal.createdAt,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    return csvContent
  }

}
