"use client"

import { useState } from "react"
import { useScreenplayStore, screenplayStore } from "@/lib/screenplay-store"
import { calculatePageCount, getDialogueActionRatio } from "@/lib/screenplay-types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ChevronRight,
  Users,
  BarChart3,
  FileText,
  MessageSquare,
  Film,
} from "lucide-react"

export function ToolsPanel() {
  const { rightPanelOpen, elements, scenes, characters } = useScreenplayStore()
  const [activeTab, setActiveTab] = useState("characters")

  // Calculate analytics
  const pageCount = calculatePageCount(elements)
  const { dialogue, action, ratio } = getDialogueActionRatio(elements)
  const characterList = Array.from(characters.values()).sort(
    (a, b) => b.dialogueCount - a.dialogueCount
  )

  if (!rightPanelOpen) {
    return (
      <div className="w-10 border-l border-border bg-sidebar flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => screenplayStore.toggleRightPanel()}
          className="h-8 w-8"
        >
          <Users className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => screenplayStore.toggleRightPanel()}
          className="h-8 w-8"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-72 border-l border-border bg-sidebar flex flex-col panel transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-medium">Tools</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => screenplayStore.toggleRightPanel()}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-3 py-2 border-b border-border">
          <TabsList className="w-full h-8">
            <TabsTrigger value="characters" className="flex-1 text-xs h-7">
              <Users className="h-3 w-3 mr-1.5" />
              Characters
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 text-xs h-7">
              <BarChart3 className="h-3 w-3 mr-1.5" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Characters Tab */}
        <TabsContent value="characters" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {characterList.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8 px-4">
                  Characters will appear here as you write dialogue
                </p>
              ) : (
                characterList.map((character) => (
                  <CharacterCard
                    key={character.name}
                    character={character}
                    totalDialogue={characterList.reduce((sum, c) => sum + c.dialogueCount, 0)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Page count */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Pages</span>
                  </div>
                  <span className="text-2xl font-mono font-bold">{pageCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ~{pageCount} minutes runtime
                </p>
              </div>

              {/* Scene count */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Film className="h-4 w-4 text-muted-foreground" />
                    <span>Scenes</span>
                  </div>
                  <span className="text-2xl font-mono font-bold">{scenes.length}</span>
                </div>
              </div>

              {/* Dialogue vs Action */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>Dialogue vs Action</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Dialogue</span>
                    <span className="font-mono">{dialogue}%</span>
                  </div>
                  <Progress value={dialogue} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span>Action</span>
                    <span className="font-mono">{action}%</span>
                  </div>
                  <Progress value={action} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ratio: {ratio}
                </p>
              </div>

              {/* Character count */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Characters</span>
                  </div>
                  <span className="text-2xl font-mono font-bold">{characters.size}</span>
                </div>
              </div>

              {/* Top characters by dialogue */}
              {characterList.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Top Characters</h4>
                  <div className="space-y-2">
                    {characterList.slice(0, 5).map((char, index) => {
                      const totalDialogue = characterList.reduce((sum, c) => sum + c.dialogueCount, 0)
                      const percentage = totalDialogue > 0 ? Math.round((char.dialogueCount / totalDialogue) * 100) : 0
                      return (
                        <div key={char.name} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                          <span className="text-xs font-mono flex-1 truncate">{char.name}</span>
                          <span className="text-xs text-muted-foreground">{percentage}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface CharacterCardProps {
  character: { name: string; dialogueCount: number; sceneAppearances: string[]; notes?: string }
  totalDialogue: number
}

function CharacterCard({ character, totalDialogue }: CharacterCardProps) {
  const percentage = totalDialogue > 0 ? Math.round((character.dialogueCount / totalDialogue) * 100) : 0

  return (
    <div className="rounded-md bg-background/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono font-medium truncate">{character.name}</span>
        <span className="text-xs text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-1.5" />
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{character.dialogueCount} lines</span>
        <span>{character.sceneAppearances.length} scenes</span>
      </div>
    </div>
  )
}
