"use client"

import { useState, useCallback, useEffect } from "react"
import { useScreenplayStore, screenplayStore } from "@/lib/screenplay-store"
import { exportToPDF } from "@/lib/export-pdf"
import { Header } from "@/components/screenplay/header"
import { ScenePanel } from "@/components/screenplay/scene-panel"
import { ToolsPanel } from "@/components/screenplay/tools-panel"
import { ScreenplayEditor } from "@/components/screenplay/screenplay-editor"
import { CommandPalette, useGlobalKeyboardShortcuts } from "@/components/screenplay/command-palette"
import { KeyboardHints } from "@/components/screenplay/keyboard-hints"
import { cn } from "@/lib/utils"

export default function ScreenplayApp() {
  const { focusMode, title, author, elements } = useScreenplayStore()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Load saved script on mount
  useEffect(() => {
    screenplayStore.loadFromLocalStorage()
  }, [])

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true)
  }, [])

  const handleExportPDF = useCallback(async () => {
    await exportToPDF({ title, author, elements })
  }, [title, author, elements])

  // Global keyboard shortcuts
  useGlobalKeyboardShortcuts(handleOpenCommandPalette, handleExportPDF)

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <Header onOpenCommandPalette={handleOpenCommandPalette} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Scene Manager */}
        <ScenePanel />

        {/* Center - Editor */}
        <main className="flex-1 flex flex-col overflow-hidden bg-muted/30">
          <ScreenplayEditor />

          {/* Bottom keyboard hints */}
          {!focusMode && (
            <div className="px-4 py-2 border-t border-border bg-background">
              <KeyboardHints />
            </div>
          )}
        </main>

        {/* Right panel - Tools */}
        <ToolsPanel />
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onExportPDF={handleExportPDF}
      />

      {/* Focus mode exit hint */}
      {focusMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm border border-border rounded-md px-4 py-2 text-xs text-muted-foreground">
          Press <kbd className="mx-1 px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">Ctrl+Shift+F</kbd> or{" "}
          <kbd className="mx-1 px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">/</kbd> to exit focus mode
        </div>
      )}
    </div>
  )
}
