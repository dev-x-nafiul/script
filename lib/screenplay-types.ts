// Core screenplay element types
export type ElementType =
  | "scene-heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "shot"

export interface ScreenplayElement {
  id: string
  type: ElementType
  content: string
  sceneId?: string
}

export interface Scene {
  id: string
  number: number
  heading: string
  elementIds: string[]
  act?: number
}

export interface Character {
  name: string
  dialogueCount: number
  sceneAppearances: string[]
  notes?: string
}

export interface Script {
  id: string
  title: string
  author: string
  elements: ScreenplayElement[]
  scenes: Scene[]
  characters: Map<string, Character>
  createdAt: Date
  updatedAt: Date
}

// Element type configurations
export const ELEMENT_CONFIG: Record<
  ElementType,
  {
    label: string
    shortcut: string
    placeholder: string
    nextElement: ElementType
    autoUppercase: boolean
  }
> = {
  "scene-heading": {
    label: "Scene Heading",
    shortcut: "1",
    placeholder: "INT./EXT. LOCATION - TIME",
    nextElement: "action",
    autoUppercase: true,
  },
  action: {
    label: "Action",
    shortcut: "2",
    placeholder: "Action description...",
    nextElement: "action",
    autoUppercase: false,
  },
  character: {
    label: "Character",
    shortcut: "3",
    placeholder: "CHARACTER NAME",
    nextElement: "dialogue",
    autoUppercase: true,
  },
  dialogue: {
    label: "Dialogue",
    shortcut: "4",
    placeholder: "Dialogue...",
    nextElement: "character",
    autoUppercase: false,
  },
  parenthetical: {
    label: "Parenthetical",
    shortcut: "5",
    placeholder: "(emotion/direction)",
    nextElement: "dialogue",
    autoUppercase: false,
  },
  transition: {
    label: "Transition",
    shortcut: "6",
    placeholder: "CUT TO:",
    nextElement: "scene-heading",
    autoUppercase: true,
  },
  shot: {
    label: "Shot",
    shortcut: "7",
    placeholder: "ANGLE ON:",
    nextElement: "action",
    autoUppercase: true,
  },
}

// Auto-complete suggestions
export const SCENE_PREFIXES = ["INT.", "EXT.", "INT./EXT.", "I/E."]
export const TIME_SUFFIXES = ["DAY", "NIGHT", "MORNING", "EVENING", "LATER", "CONTINUOUS", "SAME"]
export const TRANSITIONS = [
  "CUT TO:",
  "FADE IN:",
  "FADE OUT.",
  "FADE TO BLACK.",
  "DISSOLVE TO:",
  "SMASH CUT TO:",
  "MATCH CUT TO:",
  "JUMP CUT TO:",
  "TIME CUT:",
]

// Helper to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Create a new element
export function createElement(
  type: ElementType,
  content: string = "",
  sceneId?: string
): ScreenplayElement {
  return {
    id: generateId(),
    type,
    content,
    sceneId,
  }
}

// Create a new scene from a scene heading element
export function createScene(headingElement: ScreenplayElement, number: number): Scene {
  return {
    id: generateId(),
    number,
    heading: headingElement.content,
    elementIds: [headingElement.id],
  }
}

// Calculate page count (industry standard: ~1 page per minute, ~55 lines per page)
export function calculatePageCount(elements: ScreenplayElement[]): number {
  let lineCount = 0

  for (const element of elements) {
    const contentLines = Math.ceil(element.content.length / 60) || 1

    switch (element.type) {
      case "scene-heading":
        lineCount += contentLines + 2 // Extra spacing
        break
      case "action":
        lineCount += contentLines + 1
        break
      case "character":
        lineCount += 1
        break
      case "dialogue":
        lineCount += contentLines
        break
      case "parenthetical":
        lineCount += 1
        break
      case "transition":
        lineCount += 2
        break
      case "shot":
        lineCount += 2
        break
    }
  }

  return Math.max(1, Math.ceil(lineCount / 55))
}

// Extract characters from script elements
export function extractCharacters(elements: ScreenplayElement[]): Map<string, Character> {
  const characters = new Map<string, Character>()
  let currentSceneId: string | undefined

  for (const element of elements) {
    if (element.type === "scene-heading") {
      currentSceneId = element.sceneId
    }

    if (element.type === "character" && element.content.trim()) {
      const name = element.content.trim().toUpperCase()
      const existing = characters.get(name)

      if (existing) {
        existing.dialogueCount++
        if (currentSceneId && !existing.sceneAppearances.includes(currentSceneId)) {
          existing.sceneAppearances.push(currentSceneId)
        }
      } else {
        characters.set(name, {
          name,
          dialogueCount: 1,
          sceneAppearances: currentSceneId ? [currentSceneId] : [],
        })
      }
    }
  }

  return characters
}

// Get dialogue vs action ratio
export function getDialogueActionRatio(elements: ScreenplayElement[]): {
  dialogue: number
  action: number
  ratio: string
} {
  let dialogueChars = 0
  let actionChars = 0

  for (const element of elements) {
    if (element.type === "dialogue") {
      dialogueChars += element.content.length
    } else if (element.type === "action") {
      actionChars += element.content.length
    }
  }

  const total = dialogueChars + actionChars
  if (total === 0) return { dialogue: 0, action: 0, ratio: "0:0" }

  const dialoguePercent = Math.round((dialogueChars / total) * 100)
  const actionPercent = 100 - dialoguePercent

  return {
    dialogue: dialoguePercent,
    action: actionPercent,
    ratio: `${dialoguePercent}:${actionPercent}`,
  }
}
