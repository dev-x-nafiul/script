"use client"

import { Kbd } from "@/components/ui/kbd"

export function KeyboardHints() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Kbd>Enter</Kbd>
        <span>New element</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Kbd>Tab</Kbd>
        <span>Cycle type</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Kbd>/</Kbd>
        <span>Commands</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Kbd>Ctrl</Kbd>
        <span>+</span>
        <Kbd>1-6</Kbd>
        <span>Force type</span>
      </div>
    </div>
  )
}

export function ElementTypeHints() {
  const hints = [
    { key: "1", type: "Scene" },
    { key: "2", type: "Action" },
    { key: "3", type: "Character" },
    { key: "4", type: "Dialogue" },
    { key: "5", type: "Parens" },
    { key: "6", type: "Transition" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {hints.map(({ key, type }) => (
        <div key={key} className="flex items-center gap-1 text-xs text-muted-foreground">
          <Kbd className="text-[10px] px-1.5 py-0.5">{key}</Kbd>
          <span>{type}</span>
        </div>
      ))}
    </div>
  )
}
