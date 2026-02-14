"use client"

import { useState, useEffect } from "react"
import { useScreenplayStore, screenplayStore } from "@/lib/screenplay-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import {
  Menu,
  Save,
  Download,
  FileText,
  Moon,
  Sun,
  Maximize,
  Settings,
  FilePlus,
  Check,
} from "lucide-react"
import { exportToPDF, downloadFountain } from "@/lib/export-pdf"

interface HeaderProps {
  onOpenCommandPalette: () => void
}

export function Header({ onOpenCommandPalette }: HeaderProps) {
  const { title, author, isDirty, lastSaved, focusMode, elements } = useScreenplayStore()
  const { theme, setTheme } = useTheme()
  const [editingTitle, setEditingTitle] = useState(false)
  const [localTitle, setLocalTitle] = useState(title)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [localAuthor, setLocalAuthor] = useState(author)
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setLocalTitle(title)
  }, [title])

  useEffect(() => {
    setLocalAuthor(author)
  }, [author])

  useEffect(() => {
    if (isDirty) {
      setSaveStatus("unsaved")
    } else if (lastSaved) {
      setSaveStatus("saved")
    }
  }, [isDirty, lastSaved])

  const handleTitleSubmit = () => {
    screenplayStore.setTitle(localTitle)
    setEditingTitle(false)
  }

  const handleSave = () => {
    setSaveStatus("saving")
    screenplayStore.saveToLocalStorage()
    setTimeout(() => setSaveStatus("saved"), 500)
  }

  const handleExportPDF = async () => {
    await exportToPDF({ title, author, elements })
  }

  const handleExportFountain = () => {
    downloadFountain({ title, author, elements })
  }

  const handleNewScript = () => {
    if (isDirty && !confirm("You have unsaved changes. Create a new script anyway?")) {
      return
    }
    screenplayStore.newScript()
  }

  const handleSettingsSave = () => {
    screenplayStore.setAuthor(localAuthor)
    setSettingsOpen(false)
  }

  if (focusMode) {
    return null
  }

  return (
    <>
      <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={handleNewScript}>
                <FilePlus className="h-4 w-4 mr-2" />
                New Script
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportFountain}>
                <FileText className="h-4 w-4 mr-2" />
                Export Fountain
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Script Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Title */}
          {editingTitle ? (
            <Input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
              className="h-7 w-48 text-sm"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="text-sm font-medium hover:text-foreground/80 transition-colors"
            >
              {title}
            </button>
          )}

          {/* Save status */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveStatus === "saved" && (
              <>
                <Check className="h-3 w-3 text-green-500" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === "saving" && <span>Saving...</span>}
            {saveStatus === "unsaved" && <span className="text-amber-500">Unsaved</span>}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenCommandPalette}
            className="h-8 w-8"
            title="Command Palette (Press /)"
          >
            <span className="text-xs font-mono">/</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => screenplayStore.toggleFocusMode()}
            className="h-8 w-8"
            title="Focus Mode"
          >
            <Maximize className="h-4 w-4" />
          </Button>

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </header>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Script Settings</DialogTitle>
            <DialogDescription>Configure your screenplay details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Untitled Screenplay"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={localAuthor}
                onChange={(e) => setLocalAuthor(e.target.value)}
                placeholder="Your name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSettingsSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
