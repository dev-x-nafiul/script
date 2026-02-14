"use client"

import { useSyncExternalStore, useCallback } from "react"
import {
  type ScreenplayElement,
  type Scene,
  type Character,
  type ElementType,
  createElement,
  generateId,
  extractCharacters,
  calculatePageCount,
  getDialogueActionRatio,
  ELEMENT_CONFIG,
} from "./screenplay-types"

interface ScriptState {
  id: string
  title: string
  author: string
  elements: ScreenplayElement[]
  scenes: Scene[]
  characters: Map<string, Character>
  activeElementId: string | null
  focusMode: boolean
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  isDirty: boolean
  lastSaved: Date | null
}

type Listener = () => void

// Create the store
function createScreenplayStore() {
  let state: ScriptState = {
    id: generateId(),
    title: "Untitled Screenplay",
    author: "",
    elements: [createElement("scene-heading", "", undefined)],
    scenes: [],
    characters: new Map(),
    activeElementId: null,
    focusMode: false,
    leftPanelOpen: true,
    rightPanelOpen: true,
    isDirty: false,
    lastSaved: null,
  }

  // Set initial active element
  state.activeElementId = state.elements[0].id

  const listeners = new Set<Listener>()

  function getState() {
    return state
  }

  function setState(newState: Partial<ScriptState>) {
    state = { ...state, ...newState, isDirty: true }
    listeners.forEach((listener) => listener())
    scheduleAutosave()
  }

  function subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  // Autosave logic
  let autosaveTimeout: ReturnType<typeof setTimeout> | null = null

  function scheduleAutosave() {
    if (autosaveTimeout) clearTimeout(autosaveTimeout)
    autosaveTimeout = setTimeout(() => {
      saveToLocalStorage()
    }, 2000) // Save every 2 seconds of inactivity
  }

  function saveToLocalStorage() {
    try {
      const saveData = {
        id: state.id,
        title: state.title,
        author: state.author,
        elements: state.elements,
        scenes: state.scenes,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(`scripta-script-${state.id}`, JSON.stringify(saveData))
      state = { ...state, isDirty: false, lastSaved: new Date() }
      listeners.forEach((listener) => listener())
    } catch {
      console.error("Failed to save to localStorage")
    }
  }

  function loadFromLocalStorage(id?: string) {
    try {
      const key = id ? `scripta-script-${id}` : Object.keys(localStorage).find((k) => k.startsWith("scripta-script-"))
      if (!key) return false

      const data = localStorage.getItem(id ? `scripta-script-${id}` : key)
      if (!data) return false

      const parsed = JSON.parse(data)
      state = {
        ...state,
        id: parsed.id,
        title: parsed.title,
        author: parsed.author,
        elements: parsed.elements,
        scenes: parsed.scenes || [],
        isDirty: false,
        lastSaved: new Date(parsed.savedAt),
      }
      updateDerivedState()
      listeners.forEach((listener) => listener())
      return true
    } catch {
      return false
    }
  }

  function updateDerivedState() {
    // Update characters
    state.characters = extractCharacters(state.elements)

    // Update scenes
    const scenes: Scene[] = []
    let currentScene: Scene | null = null
    let sceneNumber = 0

    for (const element of state.elements) {
      if (element.type === "scene-heading") {
        sceneNumber++
        currentScene = {
          id: generateId(),
          number: sceneNumber,
          heading: element.content,
          elementIds: [element.id],
        }
        scenes.push(currentScene)
        element.sceneId = currentScene.id
      } else if (currentScene) {
        currentScene.elementIds.push(element.id)
        element.sceneId = currentScene.id
      }
    }

    state.scenes = scenes
  }

  // Actions
  function setTitle(title: string) {
    setState({ title })
  }

  function setAuthor(author: string) {
    setState({ author })
  }

  function updateElement(id: string, content: string) {
    const elements = state.elements.map((el) => (el.id === id ? { ...el, content } : el))
    setState({ elements })
    updateDerivedState()
  }

  function setElementType(id: string, type: ElementType) {
    const elements = state.elements.map((el) => (el.id === id ? { ...el, type } : el))
    setState({ elements })
    updateDerivedState()
  }

  function insertElementAfter(afterId: string, type: ElementType, content: string = "") {
    const index = state.elements.findIndex((el) => el.id === afterId)
    if (index === -1) return null

    const currentElement = state.elements[index]
    const newElement = createElement(type, content, currentElement.sceneId)

    const elements = [...state.elements.slice(0, index + 1), newElement, ...state.elements.slice(index + 1)]

    setState({ elements, activeElementId: newElement.id })
    updateDerivedState()
    return newElement
  }

  function deleteElement(id: string) {
    if (state.elements.length <= 1) return

    const index = state.elements.findIndex((el) => el.id === id)
    if (index === -1) return

    const elements = state.elements.filter((el) => el.id !== id)
    const newActiveId = elements[Math.max(0, index - 1)]?.id || elements[0]?.id

    setState({ elements, activeElementId: newActiveId })
    updateDerivedState()
  }

  function setActiveElement(id: string | null) {
    setState({ activeElementId: id })
  }

  function moveToNextElement() {
    if (!state.activeElementId) return
    const index = state.elements.findIndex((el) => el.id === state.activeElementId)
    if (index < state.elements.length - 1) {
      setState({ activeElementId: state.elements[index + 1].id })
    }
  }

  function moveToPrevElement() {
    if (!state.activeElementId) return
    const index = state.elements.findIndex((el) => el.id === state.activeElementId)
    if (index > 0) {
      setState({ activeElementId: state.elements[index - 1].id })
    }
  }

  function cycleElementType(id: string) {
    const element = state.elements.find((el) => el.id === id)
    if (!element) return

    const types: ElementType[] = ["scene-heading", "action", "character", "dialogue", "parenthetical", "transition"]
    const currentIndex = types.indexOf(element.type)
    const nextType = types[(currentIndex + 1) % types.length]

    setElementType(id, nextType)
  }

  function getNextElementType(currentType: ElementType): ElementType {
    return ELEMENT_CONFIG[currentType].nextElement
  }

  function toggleFocusMode() {
    setState({ focusMode: !state.focusMode })
  }

  function toggleLeftPanel() {
    setState({ leftPanelOpen: !state.leftPanelOpen })
  }

  function toggleRightPanel() {
    setState({ rightPanelOpen: !state.rightPanelOpen })
  }

  function reorderScenes(fromIndex: number, toIndex: number) {
    const scenes = [...state.scenes]
    const [removed] = scenes.splice(fromIndex, 1)
    scenes.splice(toIndex, 0, removed)

    // Renumber scenes
    scenes.forEach((scene, index) => {
      scene.number = index + 1
    })

    // Reorder elements based on scene order
    const newElements: ScreenplayElement[] = []
    for (const scene of scenes) {
      for (const elementId of scene.elementIds) {
        const element = state.elements.find((el) => el.id === elementId)
        if (element) newElements.push(element)
      }
    }

    // Add any elements not in scenes (shouldn't happen but safety)
    for (const element of state.elements) {
      if (!newElements.includes(element)) {
        newElements.push(element)
      }
    }

    setState({ scenes, elements: newElements })
  }

  function newScript() {
    const id = generateId()
    state = {
      id,
      title: "Untitled Screenplay",
      author: "",
      elements: [createElement("scene-heading", "", undefined)],
      scenes: [],
      characters: new Map(),
      activeElementId: null,
      focusMode: false,
      leftPanelOpen: true,
      rightPanelOpen: true,
      isDirty: false,
      lastSaved: null,
    }
    state.activeElementId = state.elements[0].id
    listeners.forEach((listener) => listener())
  }

  // Analytics
  function getAnalytics() {
    return {
      pageCount: calculatePageCount(state.elements),
      sceneCount: state.scenes.length,
      characterCount: state.characters.size,
      ...getDialogueActionRatio(state.elements),
      characters: Array.from(state.characters.values()).sort((a, b) => b.dialogueCount - a.dialogueCount),
    }
  }

  return {
    getState,
    subscribe,
    setTitle,
    setAuthor,
    updateElement,
    setElementType,
    insertElementAfter,
    deleteElement,
    setActiveElement,
    moveToNextElement,
    moveToPrevElement,
    cycleElementType,
    getNextElementType,
    toggleFocusMode,
    toggleLeftPanel,
    toggleRightPanel,
    reorderScenes,
    newScript,
    saveToLocalStorage,
    loadFromLocalStorage,
    getAnalytics,
    updateDerivedState,
  }
}

// Singleton store instance
export const screenplayStore = createScreenplayStore()

// React hooks
export function useScreenplayStore() {
  const state = useSyncExternalStore(screenplayStore.subscribe, screenplayStore.getState, screenplayStore.getState)

  return {
    ...state,
    ...screenplayStore,
  }
}

export function useActiveElement() {
  const { elements, activeElementId } = useScreenplayStore()
  return elements.find((el) => el.id === activeElementId) || null
}

export function useScriptAnalytics() {
  const state = useSyncExternalStore(screenplayStore.subscribe, screenplayStore.getState, screenplayStore.getState)

  return useCallback(() => {
    return {
      pageCount: calculatePageCount(state.elements),
      sceneCount: state.scenes.length,
      characterCount: state.characters.size,
      ...getDialogueActionRatio(state.elements),
      characters: Array.from(state.characters.values()).sort((a, b) => b.dialogueCount - a.dialogueCount),
    }
  }, [state.elements, state.scenes, state.characters])
}
