"use client"

import React from "react"

import { useEffect, useRef, useCallback } from "react"
import { useScreenplayStore } from "@/lib/screenplay-store"
import { ScreenplayElementEditor } from "./screenplay-element"
import { cn } from "@/lib/utils"

export function ScreenplayEditor() {
  const { elements, activeElementId, setActiveElement, focusMode } = useScreenplayStore()
  const editorRef = useRef<HTMLDivElement>(null)
  const activeElementRef = useRef<HTMLDivElement>(null)

  // Scroll active element into view
  useEffect(() => {
    if (activeElementRef.current) {
      activeElementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [activeElementId])

  // Handle click outside elements to deselect
  const handleEditorClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === editorRef.current) {
        // Clicked on editor background, focus last element
        if (elements.length > 0) {
          setActiveElement(elements[elements.length - 1].id)
        }
      }
    },
    [elements, setActiveElement]
  )

  return (
    <div
      ref={editorRef}
      onClick={handleEditorClick}
      className={cn(
        "flex-1 overflow-auto screenplay-scroll",
        "px-4 py-8 md:px-8 lg:px-12",
        focusMode && "bg-background"
      )}
    >
      {/* Screenplay page container - standard US Letter proportions */}
      <div className="max-w-3xl mx-auto bg-card text-card-foreground rounded-sm shadow-sm min-h-screen">
        <div className="p-8 md:p-12 lg:p-16 screenplay-editor">
          {/* Title page area - optional */}
          <div className="space-y-0">
            {elements.map((element) => (
              <div
                key={element.id}
                ref={element.id === activeElementId ? activeElementRef : null}
              >
                <ScreenplayElementEditor
                  element={element}
                  isActive={element.id === activeElementId}
                  onFocus={() => setActiveElement(element.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
