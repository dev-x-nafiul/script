"use client"

import React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { screenplayStore, useScreenplayStore } from "@/lib/screenplay-store"
import { type ElementType, ELEMENT_CONFIG } from "@/lib/screenplay-types"
import {
  FileText,
  Film,
  User,
  MessageSquare,
  Parentheses,
  ArrowRight,
  Camera,
  Save,
  Download,
  Moon,
  Sun,
  Maximize,
  PanelLeft,
  PanelRight,
  Plus,
} from "lucide-react"
import { useTheme } from "next-themes"

const ELEMENT_ICONS: Record<ElementType, React.ElementType> = {
  "scene-heading": Film,
  action: FileText,
  character: User,
  dialogue: MessageSquare,
  parenthetical: Parentheses,
  transition: ArrowRight,
  shot: Camera,
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExportPDF: () => void
}

export function CommandPalette({ open, onOpenChange, onExportPDF }: CommandPaletteProps) {
  const { activeElementId, focusMode, leftPanelOpen, rightPanelOpen } = useScreenplayStore()
  const { theme, setTheme } = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const insertElement = useCallback(
    (type: ElementType) => {
      if (activeElementId) {
        screenplayStore.insertElementAfter(activeElementId, type)
      }
      onOpenChange(false)
    },
    [activeElementId, onOpenChange]
  )

  const setElementType = useCallback(
    (type: ElementType) => {
      if (activeElementId) {
        screenplayStore.setElementType(activeElementId, type)
      }
      onOpenChange(false)
    },
    [activeElementId, onOpenChange]
  )

  const handleExport = useCallback(() => {
    onOpenChange(false)
    onExportPDF()
  }, [onOpenChange, onExportPDF])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-lg">
        <Command className="border-0">
          <CommandInput ref={inputRef} placeholder="Type a command or search..." className="border-0" />
          <CommandList className="max-h-96">
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="Insert Element">
              {(Object.keys(ELEMENT_CONFIG) as ElementType[]).map((type) => {
                const config = ELEMENT_CONFIG[type]
                const Icon = ELEMENT_ICONS[type]
                return (
                  <CommandItem key={type} onSelect={() => insertElement(type)} className="gap-3">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <Icon className="h-4 w-4" />
                    <span>{config.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">Ctrl+{config.shortcut}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <CommandGroup heading="Change Current Element">
              {(Object.keys(ELEMENT_CONFIG) as ElementType[]).map((type) => {
                const config = ELEMENT_CONFIG[type]
                const Icon = ELEMENT_ICONS[type]
                return (
                  <CommandItem key={`change-${type}`} onSelect={() => setElementType(type)} className="gap-3">
                    <Icon className="h-4 w-4" />
                    <span>Change to {config.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <CommandGroup heading="View">
              <CommandItem onSelect={() => { screenplayStore.toggleFocusMode(); onOpenChange(false) }} className="gap-3">
                <Maximize className="h-4 w-4" />
                <span>{focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+F</span>
              </CommandItem>
              <CommandItem onSelect={() => { screenplayStore.toggleLeftPanel(); onOpenChange(false) }} className="gap-3">
                <PanelLeft className="h-4 w-4" />
                <span>{leftPanelOpen ? "Hide" : "Show"} Scene Panel</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+[</span>
              </CommandItem>
              <CommandItem onSelect={() => { screenplayStore.toggleRightPanel(); onOpenChange(false) }} className="gap-3">
                <PanelRight className="h-4 w-4" />
                <span>{rightPanelOpen ? "Hide" : "Show"} Tools Panel</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+]</span>
              </CommandItem>
              <CommandItem onSelect={() => { setTheme(theme === "dark" ? "light" : "dark"); onOpenChange(false) }} className="gap-3">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>Switch to {theme === "dark" ? "Light" : "Dark"} Mode</span>
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="File">
              <CommandItem onSelect={() => { screenplayStore.saveToLocalStorage(); onOpenChange(false) }} className="gap-3">
                <Save className="h-4 w-4" />
                <span>Save</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+S</span>
              </CommandItem>
              <CommandItem onSelect={handleExport} className="gap-3">
                <Download className="h-4 w-4" />
                <span>Export as PDF</span>
                <span className="ml-auto text-xs text-muted-foreground">Ctrl+E</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

// Global keyboard shortcuts hook
export function useGlobalKeyboardShortcuts(onCommandPalette: () => void, onExportPDF: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey } = e
      const mod = ctrlKey || metaKey

      // Command palette
      if (key === "/" || (mod && key === "k")) {
        e.preventDefault()
        onCommandPalette()
        return
      }

      // Focus mode
      if (mod && shiftKey && key.toLowerCase() === "f") {
        e.preventDefault()
        screenplayStore.toggleFocusMode()
        return
      }

      // Toggle panels
      if (mod && key === "[") {
        e.preventDefault()
        screenplayStore.toggleLeftPanel()
        return
      }
      if (mod && key === "]") {
        e.preventDefault()
        screenplayStore.toggleRightPanel()
        return
      }

      // Save
      if (mod && key.toLowerCase() === "s") {
        e.preventDefault()
        screenplayStore.saveToLocalStorage()
        return
      }

      // Export
      if (mod && key.toLowerCase() === "e") {
        e.preventDefault()
        onExportPDF()
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onCommandPalette, onExportPDF])
}
