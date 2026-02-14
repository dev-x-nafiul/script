"use client"

import { useState } from "react"
import { useScreenplayStore, screenplayStore } from "@/lib/screenplay-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  GripVertical,
  Film,
  LayoutGrid,
} from "lucide-react"

export function ScenePanel() {
  const { scenes, leftPanelOpen, activeElementId, elements } = useScreenplayStore()
  const [structureView, setStructureView] = useState<"list" | "acts">("list")

  // Find current scene based on active element
  const currentSceneId = elements.find((el) => el.id === activeElementId)?.sceneId

  const navigateToScene = (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId)
    if (scene && scene.elementIds[0]) {
      screenplayStore.setActiveElement(scene.elementIds[0])
    }
  }

  // Group scenes by act (simple 3-act structure based on position)
  const getActScenes = () => {
    const totalScenes = scenes.length
    const act1End = Math.floor(totalScenes * 0.25)
    const act2End = Math.floor(totalScenes * 0.75)

    return {
      "Act I": scenes.slice(0, act1End + 1),
      "Act II": scenes.slice(act1End + 1, act2End + 1),
      "Act III": scenes.slice(act2End + 1),
    }
  }

  if (!leftPanelOpen) {
    return (
      <div className="w-10 border-r border-border bg-sidebar flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => screenplayStore.toggleLeftPanel()}
          className="h-8 w-8"
        >
          <Film className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col panel transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-medium">Scenes</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => screenplayStore.toggleLeftPanel()}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* View toggle */}
      <div className="px-3 py-2 border-b border-border">
        <Tabs value={structureView} onValueChange={(v) => setStructureView(v as "list" | "acts")}>
          <TabsList className="w-full h-8">
            <TabsTrigger value="list" className="flex-1 text-xs h-7">
              <Film className="h-3 w-3 mr-1.5" />
              List
            </TabsTrigger>
            <TabsTrigger value="acts" className="flex-1 text-xs h-7">
              <LayoutGrid className="h-3 w-3 mr-1.5" />
              Acts
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scene list */}
      <ScrollArea className="flex-1">
        {structureView === "list" ? (
          <div className="p-2 space-y-1">
            {scenes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 px-4">
                Start writing to see your scenes here
              </p>
            ) : (
              scenes.map((scene, index) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  index={index}
                  isActive={scene.id === currentSceneId}
                  onClick={() => navigateToScene(scene.id)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="p-2 space-y-4">
            {Object.entries(getActScenes()).map(([actName, actScenes]) => (
              <div key={actName}>
                <h3 className="text-xs font-medium text-muted-foreground px-2 py-1">
                  {actName}
                </h3>
                <div className="space-y-1">
                  {actScenes.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 px-2 py-2">
                      No scenes yet
                    </p>
                  ) : (
                    actScenes.map((scene, index) => (
                      <SceneCard
                        key={scene.id}
                        scene={scene}
                        index={scenes.indexOf(scene)}
                        isActive={scene.id === currentSceneId}
                        onClick={() => navigateToScene(scene.id)}
                        compact
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Stats footer */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
        {scenes.length} scene{scenes.length !== 1 ? "s" : ""}
      </div>
    </div>
  )
}

interface SceneCardProps {
  scene: { id: string; number: number; heading: string; elementIds: string[] }
  index: number
  isActive: boolean
  onClick: () => void
  compact?: boolean
}

function SceneCard({ scene, isActive, onClick, compact }: SceneCardProps) {
  // Parse scene heading to extract location
  const parseHeading = (heading: string) => {
    const match = heading.match(/^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s*(.+?)(?:\s*-\s*(.+))?$/i)
    if (match) {
      return {
        prefix: match[1],
        location: match[2]?.trim() || "",
        time: match[3]?.trim() || "",
      }
    }
    return { prefix: "", location: heading || "Untitled Scene", time: "" }
  }

  const { prefix, location, time } = parseHeading(scene.heading)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md transition-colors",
        "hover:bg-sidebar-accent group",
        isActive && "bg-sidebar-accent",
        compact ? "px-2 py-1.5" : "px-3 py-2"
      )}
    >
      <div className="flex items-start gap-2">
        <div className="opacity-0 group-hover:opacity-50 cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-mono text-muted-foreground",
              compact ? "text-[10px]" : "text-xs"
            )}>
              {scene.number}
            </span>
            {prefix && (
              <span className={cn(
                "font-mono text-muted-foreground",
                compact ? "text-[10px]" : "text-xs"
              )}>
                {prefix}
              </span>
            )}
          </div>
          <p className={cn(
            "font-mono truncate",
            compact ? "text-xs" : "text-sm"
          )}>
            {location || "Untitled"}
          </p>
          {time && !compact && (
            <p className="text-[10px] text-muted-foreground font-mono">
              {time}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
