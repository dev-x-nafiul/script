"use client"

import React from "react"

import { useRef, useEffect, useState, useCallback, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import {
  type ScreenplayElement,
  type ElementType,
  ELEMENT_CONFIG,
  SCENE_PREFIXES,
  TRANSITIONS,
} from "@/lib/screenplay-types"
import { screenplayStore } from "@/lib/screenplay-store"

interface ScreenplayElementProps {
  element: ScreenplayElement
  isActive: boolean
  onFocus: () => void
}

export function ScreenplayElementEditor({ element, isActive, onFocus }: ScreenplayElementProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localContent, setLocalContent] = useState(element.content)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)

  // Sync local content with element content
  useEffect(() => {
    setLocalContent(element.content)
  }, [element.content])

  // Focus when active
  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus()
      // Place cursor at end
      const length = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(length, length)
    }
  }, [isActive])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [localContent])

  // Get suggestions based on element type and content
  const updateSuggestions = useCallback(
    (content: string) => {
      if (!content) {
        setShowSuggestions(false)
        return
      }

      let newSuggestions: string[] = []
      const upperContent = content.toUpperCase()

      if (element.type === "scene-heading") {
        // Suggest scene prefixes
        if (content.length <= 4) {
          newSuggestions = SCENE_PREFIXES.filter((p) => p.startsWith(upperContent) && p !== upperContent)
        }
      } else if (element.type === "transition") {
        newSuggestions = TRANSITIONS.filter((t) => t.startsWith(upperContent) && t !== upperContent)
      }

      setSuggestions(newSuggestions)
      setShowSuggestions(newSuggestions.length > 0)
      setSelectedSuggestion(0)
    },
    [element.type]
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value

    // Auto-uppercase for certain element types
    if (ELEMENT_CONFIG[element.type].autoUppercase) {
      value = value.toUpperCase()
    }

    setLocalContent(value)
    screenplayStore.updateElement(element.id, value)
    updateSuggestions(value)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const { key, ctrlKey, metaKey, shiftKey } = e

    // Handle suggestions
    if (showSuggestions) {
      if (key === "ArrowDown") {
        e.preventDefault()
        setSelectedSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1))
        return
      }
      if (key === "ArrowUp") {
        e.preventDefault()
        setSelectedSuggestion((prev) => Math.max(prev - 1, 0))
        return
      }
      if (key === "Tab" || key === "Enter") {
        if (suggestions[selectedSuggestion]) {
          e.preventDefault()
          const newContent = suggestions[selectedSuggestion]
          setLocalContent(newContent)
          screenplayStore.updateElement(element.id, newContent)
          setShowSuggestions(false)
          return
        }
      }
      if (key === "Escape") {
        setShowSuggestions(false)
        return
      }
    }

    // Tab - cycle element type
    if (key === "Tab" && !shiftKey) {
      e.preventDefault()
      screenplayStore.cycleElementType(element.id)
      return
    }

    // Enter - create new element with next logical type
    if (key === "Enter" && !shiftKey) {
      e.preventDefault()
      const nextType = screenplayStore.getNextElementType(element.type)
      screenplayStore.insertElementAfter(element.id, nextType)
      return
    }

    // Shift+Enter - new line within element (for action blocks)
    if (key === "Enter" && shiftKey) {
      // Allow default behavior for new line
      return
    }

    // Backspace on empty element - delete and move up
    if (key === "Backspace" && localContent === "") {
      e.preventDefault()
      const state = screenplayStore.getState()
      const index = state.elements.findIndex((el) => el.id === element.id)
      if (index > 0) {
        screenplayStore.deleteElement(element.id)
      }
      return
    }

    // Ctrl/Cmd + number - force element type
    if ((ctrlKey || metaKey) && key >= "1" && key <= "7") {
      e.preventDefault()
      const types: ElementType[] = [
        "scene-heading",
        "action",
        "character",
        "dialogue",
        "parenthetical",
        "transition",
        "shot",
      ]
      const typeIndex = parseInt(key) - 1
      if (types[typeIndex]) {
        screenplayStore.setElementType(element.id, types[typeIndex])
      }
      return
    }

    // Arrow up at start - move to previous element
    if (key === "ArrowUp" && textareaRef.current) {
      const { selectionStart } = textareaRef.current
      if (selectionStart === 0) {
        e.preventDefault()
        screenplayStore.moveToPrevElement()
        return
      }
    }

    // Arrow down at end - move to next element
    if (key === "ArrowDown" && textareaRef.current) {
      const { selectionStart, value } = textareaRef.current
      if (selectionStart === value.length) {
        e.preventDefault()
        screenplayStore.moveToNextElement()
        return
      }
    }
  }

  const acceptSuggestion = (suggestion: string) => {
    setLocalContent(suggestion)
    screenplayStore.updateElement(element.id, suggestion)
    setShowSuggestions(false)
    textareaRef.current?.focus()
  }

  const config = ELEMENT_CONFIG[element.type]

  return (
    <div className="relative group">
      {/* Element type indicator */}
      <div
        className={cn(
          "absolute -left-24 top-0 text-xs font-sans text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity w-20 text-right pr-2",
          isActive && "opacity-100"
        )}
      >
        {config.label}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={localContent}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={config.placeholder}
        rows={1}
        spellCheck={false}
        className={cn(
          "w-full bg-transparent resize-none outline-none font-mono screenplay-element",
          "placeholder:text-muted-foreground/40",
          // Element-specific styles
          element.type === "scene-heading" && "element-scene-heading font-bold",
          element.type === "action" && "element-action",
          element.type === "character" && "element-character",
          element.type === "dialogue" && "element-dialogue",
          element.type === "parenthetical" && "element-parenthetical",
          element.type === "transition" && "element-transition",
          element.type === "shot" && "element-shot"
        )}
      />

      {/* Autocomplete suggestions */}
      {showSuggestions && (
        <div className="absolute left-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg z-50 min-w-48">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => acceptSuggestion(suggestion)}
              className={cn(
                "block w-full text-left px-3 py-1.5 text-sm font-mono",
                index === selectedSuggestion && "bg-accent"
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
