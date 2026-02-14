"use client"

import type { ScreenplayElement } from "./screenplay-types"

// Industry-standard screenplay PDF margins and formatting
const PDF_CONFIG = {
  pageWidth: 8.5, // inches
  pageHeight: 11, // inches
  marginTop: 1,
  marginBottom: 1,
  marginLeft: 1.5,
  marginRight: 1,
  fontSize: 12, // points
  lineHeight: 12, // points (single-spaced for screenplays)
  charsPerLine: 60,
  linesPerPage: 55,
}

// Element margins (in character widths from left margin)
const ELEMENT_MARGINS = {
  "scene-heading": { left: 0, right: 0 },
  action: { left: 0, right: 0 },
  character: { left: 22, right: 0 },
  dialogue: { left: 10, right: 10 },
  parenthetical: { left: 15, right: 15 },
  transition: { left: 40, right: 0 },
  shot: { left: 0, right: 0 },
}

interface ExportOptions {
  title: string
  author: string
  elements: ScreenplayElement[]
  includeTitlePage?: boolean
}

// Generate Fountain format (plain text screenplay format)
export function exportToFountain(options: ExportOptions): string {
  const { title, author, elements } = options
  let output = ""

  // Title page
  output += `Title: ${title || "Untitled Screenplay"}\n`
  output += `Author: ${author || "Unknown"}\n`
  output += "\n===\n\n"

  // Elements
  for (const element of elements) {
    switch (element.type) {
      case "scene-heading":
        output += `\n${element.content.toUpperCase()}\n\n`
        break
      case "action":
        output += `${element.content}\n\n`
        break
      case "character":
        output += `\n${element.content.toUpperCase()}\n`
        break
      case "dialogue":
        output += `${element.content}\n`
        break
      case "parenthetical":
        output += `(${element.content.replace(/^\(|\)$/g, "")})\n`
        break
      case "transition":
        output += `\n> ${element.content.toUpperCase()}\n\n`
        break
      case "shot":
        output += `\n${element.content.toUpperCase()}\n\n`
        break
    }
  }

  return output
}

// Generate HTML for PDF printing
export function generatePrintHTML(options: ExportOptions): string {
  const { title, author, elements, includeTitlePage = true } = options

  const styles = `
    @page {
      size: letter;
      margin: 1in 1in 1in 1.5in;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier Prime', 'Courier New', Courier, monospace;
      font-size: 12pt;
      line-height: 1;
      color: #000;
      background: #fff;
    }
    
    .title-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
    }
    
    .title-page h1 {
      font-size: 24pt;
      font-weight: normal;
      text-transform: uppercase;
      margin-bottom: 24pt;
    }
    
    .title-page .author {
      font-size: 12pt;
      margin-top: 48pt;
    }
    
    .screenplay {
      max-width: 6in;
    }
    
    .element {
      margin: 0;
      padding: 0;
    }
    
    .scene-heading {
      text-transform: uppercase;
      font-weight: bold;
      margin-top: 24pt;
      margin-bottom: 12pt;
    }
    
    .action {
      margin-top: 12pt;
      margin-bottom: 12pt;
    }
    
    .character {
      text-transform: uppercase;
      margin-left: 2.2in;
      margin-top: 12pt;
      margin-bottom: 0;
    }
    
    .dialogue {
      margin-left: 1in;
      margin-right: 1in;
      margin-top: 0;
      margin-bottom: 12pt;
    }
    
    .parenthetical {
      margin-left: 1.5in;
      margin-right: 1.5in;
      margin-top: 0;
      margin-bottom: 0;
    }
    
    .transition {
      text-transform: uppercase;
      text-align: right;
      margin-top: 12pt;
      margin-bottom: 12pt;
    }
    
    .shot {
      text-transform: uppercase;
      margin-top: 12pt;
      margin-bottom: 12pt;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title || "Untitled Screenplay"}</title>
      <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
      <style>${styles}</style>
    </head>
    <body>
  `

  // Title page
  if (includeTitlePage) {
    html += `
      <div class="title-page">
        <h1>${title || "Untitled Screenplay"}</h1>
        <div class="author">
          <p>Written by</p>
          <p>${author || "Unknown"}</p>
        </div>
      </div>
    `
  }

  // Screenplay content
  html += `<div class="screenplay">`

  for (const element of elements) {
    const content = escapeHtml(element.content)
    html += `<p class="element ${element.type}">${content}</p>`
  }

  html += `</div></body></html>`

  return html
}

// Export to PDF using browser print
export async function exportToPDF(options: ExportOptions): Promise<void> {
  const html = generatePrintHTML(options)

  // Create a new window for printing
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    throw new Error("Could not open print window. Please allow popups.")
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for fonts to load
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Trigger print dialog
  printWindow.print()
}

// Download as Fountain file
export function downloadFountain(options: ExportOptions): void {
  const content = exportToFountain(options)
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = `${options.title || "screenplay"}.fountain`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Helper to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
