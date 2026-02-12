"use client"

import { Button } from "@/components/ui/button"
import { Search, Users, Building2, Target, BarChart3, Settings, User, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { apiClient } from "@/services/api-client"
import { useState, useEffect } from "react"

interface TeamMember {
  email: string
  name: string
  picture?: string
  role: string
  status: string
}

export type SidebarSection = "discovery" | "talents" | "companies"

interface SidebarProps {
  activeSection?: SidebarSection
  onSectionChange?: (section: SidebarSection) => void
}

export function Sidebar({ activeSection = "discovery", onSectionChange }: SidebarProps) {
  const { user, signOut } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    if (user) {
      apiClient.getUsers().then(data => {
        setTeamMembers(data.users || [])
      }).catch(() => {})
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  return (
    <div className="w-60 bg-sidebar flex flex-col">
      {/* Logo/Brand */}
      <div className="p-4 border-b border-sidebar-border bg-background rounded-none border-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground">Hyper Talent</h1>
            <p className="text-xs text-sidebar-accent-foreground">Deal Hunter</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 bg-background rounded-none border-none">
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent ${activeSection === "discovery" ? "bg-sidebar-accent" : ""}`}
          onClick={() => onSectionChange?.("discovery")}
        >
          <Search className="w-4 h-4" />
          Deal Discovery
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent ${activeSection === "talents" ? "bg-sidebar-accent" : ""}`}
          onClick={() => onSectionChange?.("talents")}
        >
          <Users className="w-4 h-4" />
          Talent Profiles
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent ${activeSection === "companies" ? "bg-sidebar-accent" : ""}`}
          onClick={() => onSectionChange?.("companies")}
        >
          <Building2 className="w-4 h-4" />
          Company Profiles
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent">
          <BarChart3 className="w-4 h-4" />
          Analytics
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </nav>

      {/* Team Members */}
      {teamMembers.length > 0 && (
        <div className="px-4 pb-3 bg-background">
          <p className="text-xs font-medium text-sidebar-accent-foreground mb-2 uppercase tracking-wider">Team</p>
          <div className="space-y-1">
            {teamMembers.map((member) => (
              <div key={member.email} className="flex items-center gap-2 py-1">
                {member.picture ? (
                  <img
                    src={member.picture}
                    alt={member.name}
                    className="w-5 h-5 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-sidebar-accent flex items-center justify-center">
                    <span className="text-[10px] font-medium">
                      {member.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                )}
                <span className="text-xs text-sidebar-foreground truncate">{member.name}</span>
                {member.status === "active" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 ml-auto" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Menu */}
      <div className="p-4 border-t border-sidebar-border bg-background border-none rounded-none">
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50">
            <User className="w-4 h-4" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-accent-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
