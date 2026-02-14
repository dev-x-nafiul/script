// PDF Export using html2pdf library
// This creates a simple PDF export without heavy dependencies

class PDFExporter {
  constructor() {
    this.pageWidth = 8.5; // inches
    this.pageHeight = 11; // inches
    this.marginLeft = 1; // inch
    this.marginRight = 1; // inch
    this.marginTop = 1; // inch
    this.marginBottom = 1; // inch
    this.lineHeight = 12; // points
    this.fontSize = 10; // points
  }

  exportToDataUrl(store) {
    const html = this.generateHTML(store);
    return html;
  }

  generateHTML(store) {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      line-height: 1;
      padding: 1in 1in 1in 1in;
      width: 6.5in;
    }
    .title {
      text-align: center;
      font-size: 18pt;
      margin-bottom: 0.5in;
      text-decoration: underline;
    }
    .author {
      text-align: center;
      font-size: 12pt;
      margin-bottom: 1in;
    }
    .scene-heading {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      text-transform: uppercase;
      font-weight: bold;
    }
    .action {
      margin-bottom: 0.5em;
    }
    .character {
      margin-top: 1em;
      margin-bottom: 0;
      text-transform: uppercase;
      font-weight: bold;
      margin-left: 2in;
    }
    .dialogue {
      margin-left: 1in;
      margin-right: 1.5in;
      margin-bottom: 0;
    }
    .parenthetical {
      margin-left: 1.5in;
      margin-right: 1.5in;
      margin-bottom: 0;
    }
    .transition {
      margin-top: 1em;
      margin-bottom: 0.5em;
      text-transform: uppercase;
      font-weight: bold;
      text-align: right;
    }
    .shot {
      margin-top: 1em;
      margin-bottom: 0.5em;
      text-transform: uppercase;
      font-weight: bold;
    }
    @media print {
      body {
        page-break-inside: avoid;
      }
      .scene-heading, .action, .character, .dialogue, .parenthetical, .transition, .shot {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
`;

    // Add title and author
    if (store.script.title) {
      html += `<div class="title">${this.escapeHtml(store.script.title)}</div>`;
    }
    if (store.script.author) {
      html += `<div class="author">by ${this.escapeHtml(store.script.author)}</div>`;
    }

    // Add screenplay elements
    for (const element of store.script.elements) {
      const config = ELEMENT_CONFIG[element.type];
      let text = this.escapeHtml(element.content);

      if (config.autoUppercase) {
        text = text.toUpperCase();
      }

      html += `<div class="${element.type}">${text}</div>`;
    }

    html += `
</body>
</html>
`;

    return html;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async downloadPDF(store) {
    const html = this.generateHTML(store);
    
    // Create an iframe to print
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    
    // Wait for content to load
    await new Promise(resolve => {
      iframe.onload = resolve;
      iframe.contentWindow.print();
    });
    
    // Clean up
    document.body.removeChild(iframe);
  }

  // Alternative: Generate downloadable HTML as a temporary solution
  downloadAsHTML(store) {
    const html = this.generateHTML(store);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${store.script.title || 'screenplay'}-print.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

const pdfExporter = new PDFExporter();
