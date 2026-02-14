// Main app controller
class ScreenplayApp {
  constructor() {
    this.store = screenplayStore;
    this.selectedElement = null;
    this.commandPaletteOpen = false;
    this.commandResults = [];
    this.theme = this.getTheme();

    this.initializeElements();
    this.bindEvents();
    this.render();
    this.setupAutoSave();
    this.store.subscribe(() => this.render());
  }

  // Initialize DOM elements
  initializeElements() {
    this.elements = {
      editorContent: document.getElementById('editor-content'),
      scenesList: document.getElementById('scenes-list'),
      charactersList: document.getElementById('characters-list'),
      titleDisplay: document.getElementById('title-display'),
      pageCount: document.getElementById('page-count'),
      wordCount: document.getElementById('word-count'),
      saveStatus: document.getElementById('save-status'),
      
      // Buttons
      themeToggle: document.getElementById('theme-toggle'),
      focusToggle: document.getElementById('focus-toggle'),
      leftPanelToggle: document.getElementById('left-panel-toggle'),
      rightPanelToggle: document.getElementById('right-panel-toggle'),
      commandPaletteToggle: document.getElementById('command-palette-toggle'),

      // Panels
      leftPanel: document.getElementById('left-panel'),
      rightPanel: document.getElementById('right-panel'),
      screenplayContainer: document.getElementById('screenplay-container'),

      // Command palette
      commandPalette: document.getElementById('command-palette'),
      commandInput: document.getElementById('command-input'),
      commandResults: document.getElementById('command-results'),

      // Dialogs
      titleDialog: document.getElementById('title-dialog'),
      titleInput: document.getElementById('title-input'),
      authorInput: document.getElementById('author-input'),
      saveTitleBtn: document.getElementById('save-title'),
      cancelTitleBtn: document.getElementById('cancel-title'),
    };
  }

  // Bind events
  bindEvents() {
    // Theme toggle
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

    // Panel toggles
    this.elements.focusToggle.addEventListener('click', () => this.toggleFocusMode());
    this.elements.leftPanelToggle.addEventListener('click', () => this.toggleLeftPanel());
    this.elements.rightPanelToggle.addEventListener('click', () => this.toggleRightPanel());

    // Command palette
    this.elements.commandPaletteToggle.addEventListener('click', () => this.openCommandPalette());
    this.elements.commandInput.addEventListener('input', (e) => this.filterCommandPalette(e.target.value));
    this.elements.commandInput.addEventListener('keydown', (e) => this.handleCommandPaletteKeydown(e));
    this.elements.commandPalette.addEventListener('click', (e) => {
      if (e.target === this.elements.commandPalette) this.closeCommandPalette();
    });

    // Title dialog
    this.elements.saveTitleBtn.addEventListener('click', () => this.saveTitle());
    this.elements.cancelTitleBtn.addEventListener('click', () => this.closeTitleDialog());
    this.elements.titleInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.saveTitle();
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

    // Auto-save periodically
    setInterval(() => {
      if (this.store.state.isDirty) {
        this.store.saveToLocalStorage();
      }
    }, 5000);
  }

  // Render UI
  render() {
    this.renderEditor();
    this.renderScenes();
    this.renderCharacters();
    this.updateStats();
    this.updateUI();
  }

  renderEditor() {
    this.elements.editorContent.innerHTML = '';
    this.elements.titleDisplay.textContent = this.store.script.title || 'Untitled Screenplay';

    for (const element of this.store.script.elements) {
      const div = document.createElement('div');
      div.className = `screenplay-element ${element.type}`;
      div.id = `element-${element.id}`;
      
      const config = ELEMENT_CONFIG[element.type];
      
      const input = document.createElement('textarea');
      input.value = element.content;
      input.placeholder = config.placeholder;
      input.className = 'screenplay-element-input';
      input.style.fontFamily = 'var(--font-mono)';
      input.style.fontSize = '12px';
      input.style.lineHeight = '1';
      input.style.resize = 'none';
      input.style.margin = '0';
      input.style.padding = '0';
      input.style.border = 'none';
      input.style.background = 'transparent';
      input.style.color = 'currentColor';
      input.style.width = '100%';
      input.rows = Math.max(1, Math.ceil(element.content.length / 60) || 1);

      input.addEventListener('focus', () => {
        this.selectElement(element.id);
      });

      input.addEventListener('input', (e) => {
        this.store.updateElement(element.id, e.target.value);
        input.rows = Math.max(1, Math.ceil(e.target.value.length / 60) || 1);
      });

      input.addEventListener('keydown', (e) => this.handleElementKeydown(e, element));

      div.appendChild(input);
      this.elements.editorContent.appendChild(div);

      if (element.id === this.store.state.activeElementId) {
        setTimeout(() => input.focus(), 0);
      }
    }
  }

  renderScenes() {
    this.elements.scenesList.innerHTML = '';

    for (const scene of this.store.script.scenes) {
      const div = document.createElement('div');
      div.className = 'scene-item';
      if (this.isSceneActive(scene.id)) {
        div.classList.add('active');
      }

      const text = document.createElement('div');
      text.textContent = `${scene.number}. ${scene.heading}`;

      div.appendChild(text);
      div.addEventListener('click', () => this.focusSceneElement(scene));

      this.elements.scenesList.appendChild(div);
    }
  }

  renderCharacters() {
    this.elements.charactersList.innerHTML = '';

    const sortedCharacters = Array.from(this.store.script.characters.values())
      .sort((a, b) => b.dialogueCount - a.dialogueCount);

    for (const character of sortedCharacters) {
      const div = document.createElement('div');
      div.className = 'character-item';

      const name = document.createElement('div');
      name.className = 'character-item-name';
      name.textContent = character.name;

      const dialogue = document.createElement('div');
      dialogue.className = 'character-item-stat';
      dialogue.textContent = `${character.dialogueCount} dialogue${character.dialogueCount !== 1 ? 's' : ''}`;

      const scenes = document.createElement('div');
      scenes.className = 'character-item-stat';
      scenes.textContent = `${character.sceneAppearances.length} scene${character.sceneAppearances.length !== 1 ? 's' : ''}`;

      div.appendChild(name);
      div.appendChild(dialogue);
      div.appendChild(scenes);

      this.elements.charactersList.appendChild(div);
    }
  }

  updateStats() {
    const stats = this.store.getStats();
    this.elements.pageCount.textContent = `Page ${stats.pageCount}`;
    this.elements.wordCount.textContent = `Words: ${stats.wordCount}`;
    
    if (this.store.state.isDirty) {
      this.elements.saveStatus.textContent = 'Unsaved changes';
      this.elements.saveStatus.style.color = 'hsl(var(--destructive))';
    } else if (this.store.state.lastSaved) {
      const lastSaved = new Date(this.store.state.lastSaved);
      const now = new Date();
      const diff = now - lastSaved;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);

      if (minutes === 0) {
        this.elements.saveStatus.textContent = 'Just now';
      } else if (minutes < 60) {
        this.elements.saveStatus.textContent = `${minutes}m ago`;
      } else {
        this.elements.saveStatus.textContent = 'Saved';
      }
      this.elements.saveStatus.style.color = 'hsl(var(--muted-foreground))';
    }
  }

  updateUI() {
    const state = this.store.state;

    // Update theme
    this.updateThemeDisplay();

    // Focus mode
    if (state.focusMode) {
      this.elements.leftPanel.style.display = 'none';
      this.elements.rightPanel.style.display = 'none';
    } else {
      this.elements.leftPanel.style.display = state.leftPanelOpen ? 'block' : 'none';
      this.elements.rightPanel.style.display = state.rightPanelOpen ? 'block' : 'none';
    }

    // Panel visibility
    this.elements.leftPanel.style.display = (state.focusMode || !state.leftPanelOpen) ? 'none' : 'block';
    this.elements.rightPanel.style.display = (state.focusMode || !state.rightPanelOpen) ? 'none' : 'block';
  }

  // Element selection and operations
  selectElement(id) {
    this.store.setActiveElement(id);
    this.selectedElement = id;
  }

  isSceneActive(sceneId) {
    if (!this.store.state.activeElementId) return false;
    const activeElement = this.store.script.elements.find(e => e.id === this.store.state.activeElementId);
    return activeElement && activeElement.sceneId === sceneId;
  }

  focusSceneElement(scene) {
    const firstElement = this.store.script.elements.find(e => scene.elementIds.includes(e.id));
    if (firstElement) {
      this.selectElement(firstElement.id);
      const input = document.querySelector(`[data-element-id="${firstElement.id}"] textarea`);
      if (input) input.focus();
    }
  }

  // Element keyboard handling
  handleElementKeydown(e, element) {
    const { key, ctrlKey, metaKey, shiftKey } = e;
    const mod = ctrlKey || metaKey;

    // Handle keyboard shortcuts for element types
    if (mod) {
      for (const [type, config] of Object.entries(ELEMENT_CONFIG)) {
        if (key === config.shortcut) {
          e.preventDefault();
          this.store.setElementType(element.id, type);
          return;
        }
      }
    }

    // Insert new element
    if (key === 'Enter' && !shiftKey) {
      e.preventDefault();
      const config = ELEMENT_CONFIG[element.type];
      const newId = this.store.addElement(config.nextElement, element.id);
      
      setTimeout(() => {
        const newInput = document.querySelector(`#element-${newId} textarea`);
        if (newInput) newInput.focus();
      }, 0);
    }

    // Delete element
    if (key === 'Backspace' && e.target.value === '') {
      const index = this.store.script.elements.findIndex(el => el.id === element.id);
      if (index > 0) {
        e.preventDefault();
        const prevId = this.store.script.elements[index - 1].id;
        this.store.deleteElement(element.id);
        
        setTimeout(() => {
          const prevInput = document.querySelector(`#element-${prevId} textarea`);
          if (prevInput) prevInput.focus();
        }, 0);
      }
    }
  }

  // Global keyboard shortcuts
  handleGlobalKeydown(e) {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = e;
    const mod = ctrlKey || metaKey;

    // Command palette
    if (key === '/' || (mod && key.toLowerCase() === 'k')) {
      e.preventDefault();
      this.openCommandPalette();
      return;
    }

    // Focus mode
    if (mod && shiftKey && key.toLowerCase() === 'f') {
      e.preventDefault();
      this.toggleFocusMode();
      return;
    }

    // Toggle left panel
    if (mod && key === '[') {
      e.preventDefault();
      this.toggleLeftPanel();
      return;
    }

    // Toggle right panel
    if (mod && key === ']') {
      e.preventDefault();
      this.toggleRightPanel();
      return;
    }

    // Save
    if (mod && key.toLowerCase() === 's') {
      e.preventDefault();
      this.store.saveToLocalStorage();
      return;
    }

    // Export
    if (mod && key.toLowerCase() === 'e') {
      e.preventDefault();
      this.exportPDF();
      return;
    }
  }

  // Theme management
  getTheme() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    this.applyTheme();
  }

  applyTheme() {
    const html = document.documentElement;
    if (this.theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
      html.classList.add('dark');
    } else {
      html.removeAttribute('data-theme');
      html.classList.remove('dark');
    }
  }

  updateThemeDisplay() {
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    
    if (this.theme === 'dark') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  }

  // Panel toggles
  toggleFocusMode() {
    this.store.toggleFocusMode();
  }

  toggleLeftPanel() {
    this.store.toggleLeftPanel();
  }

  toggleRightPanel() {
    this.store.toggleRightPanel();
  }

  // Command palette
  openCommandPalette() {
    this.commandPaletteOpen = true;
    this.elements.commandPalette.classList.add('show');
    this.elements.commandPalette.style.display = 'flex';
    this.elements.commandInput.value = '';
    this.elements.commandInput.focus();
    this.renderCommandPalette('');
  }

  closeCommandPalette() {
    this.commandPaletteOpen = false;
    this.elements.commandPalette.classList.remove('show');
    this.elements.commandPalette.style.display = 'none';
  }

  renderCommandPalette(query) {
    const html = [];
    const lowerQuery = query.toLowerCase();

    // Insert Element
    const insertElements = Object.entries(ELEMENT_CONFIG).filter(([type, config]) => {
      return type.includes(lowerQuery) || config.label.toLowerCase().includes(lowerQuery);
    });

    if (insertElements.length > 0) {
      html.push('<div class="command-group">');
      html.push('<div class="command-group-label">Insert Element</div>');
      
      for (const [type, config] of insertElements) {
        html.push(`
          <div class="command-item" onclick="app.insertElement('${type}')">
            <span>${config.label}</span>
            <span style="margin-left: auto; font-size: 0.75rem; color: hsl(var(--muted-foreground));">Ctrl+${config.shortcut}</span>
          </div>
        `);
      }
      html.push('</div>');
    }

    // Change Element
    if (!query || 'change'.includes(lowerQuery)) {
      const changeElements = Object.entries(ELEMENT_CONFIG).filter(([type, config]) => {
        return !query || type.includes(lowerQuery) || config.label.toLowerCase().includes(lowerQuery);
      });

      if (changeElements.length > 0 && this.store.state.activeElementId) {
        html.push('<div class="command-group">');
        html.push('<div class="command-group-label">Change Current Element</div>');
        
        for (const [type, config] of changeElements) {
          html.push(`
            <div class="command-item" onclick="app.changeElementType('${type}')">
              <span>Change to ${config.label}</span>
            </div>
          `);
        }
        html.push('</div>');
      }
    }

    // View options
    if (!query || 'view'.includes(lowerQuery) || 'focus'.includes(lowerQuery) || 'panel'.includes(lowerQuery) || 'theme'.includes(lowerQuery)) {
      html.push('<div class="command-group">');
      html.push('<div class="command-group-label">View</div>');
      
      html.push(`
        <div class="command-item" onclick="app.toggleFocusMode()">
          <span>${this.store.state.focusMode ? 'Exit' : 'Enter'} Focus Mode</span>
          <span style="margin-left: auto; font-size: 0.75rem; color: hsl(var(--muted-foreground));">Ctrl+Shift+F</span>
        </div>
      `);
      
      html.push(`
        <div class="command-item" onclick="app.toggleLeftPanel()">
          <span>${this.store.state.leftPanelOpen ? 'Hide' : 'Show'} Scene Panel</span>
          <span style="margin-left: auto; font-size: 0.75rem; color: hsl(var(--muted-foreground));">Ctrl+[</span>
        </div>
      `);
      
      html.push(`
        <div class="command-item" onclick="app.toggleRightPanel()">
          <span>${this.store.state.rightPanelOpen ? 'Hide' : 'Show'} Tools Panel</span>
          <span style="margin-left: auto; font-size: 0.75rem; color: hsl(var(--muted-foreground));">Ctrl+]</span>
        </div>
      `);
      
      html.push(`
        <div class="command-item" onclick="app.toggleTheme()">
          <span>Switch to ${this.theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
        </div>
      `);
      
      html.push('</div>');
    }

    // File operations
    if (!query || 'save'.includes(lowerQuery) || 'export'.includes(lowerQuery) || 'download'.includes(lowerQuery)) {
      html.push('<div class="command-group">');
      html.push('<div class="command-group-label">File</div>');
      
      html.push(`
        <div class="command-item" onclick="app.saveScreenplay()">
          <span>Save</span>
          <span style="margin-left: auto; font-size: 0.75rem; color: hsl(var(--muted-foreground));">Ctrl+S</span>
        </div>
      `);
      
      html.push(`
        <div class="command-item" onclick="app.exportPDF()">
          <span>Export as PDF</span>
          <span style="margin-left: auto; font-size: 0.75rem; color: hsl(var(--muted-foreground));">Ctrl+E</span>
        </div>
      `);
      
      html.push(`
        <div class="command-item" onclick="app.exportFountain()">
          <span>Export as Fountain</span>
        </div>
      `);
      
      html.push('</div>');
    }

    this.elements.commandResults.innerHTML = html.join('');
  }

  filterCommandPalette(query) {
    this.renderCommandPalette(query);
  }

  handleCommandPaletteKeydown(e) {
    if (e.key === 'Escape') {
      this.closeCommandPalette();
    }
  }

  // Command actions
  insertElement(type) {
    if (this.store.state.activeElementId) {
      const newId = this.store.addElement(type, this.store.state.activeElementId);
      this.closeCommandPalette();
      setTimeout(() => {
        const input = document.querySelector(`#element-${newId} textarea`);
        if (input) input.focus();
      }, 0);
    }
  }

  changeElementType(type) {
    if (this.store.state.activeElementId) {
      this.store.setElementType(this.store.state.activeElementId, type);
      this.closeCommandPalette();
    }
  }

  // Title dialog
  openTitleDialog() {
    this.elements.titleInput.value = this.store.script.title;
    this.elements.authorInput.value = this.store.script.author;
    this.elements.titleDialog.style.display = 'flex';
  }

  closeTitleDialog() {
    this.elements.titleDialog.style.display = 'none';
  }

  saveTitle() {
    this.store.updateTitle(this.elements.titleInput.value);
    this.store.updateAuthor(this.elements.authorInput.value);
    this.closeTitleDialog();
  }

  // Save and export
  saveScreenplay() {
    this.store.saveToLocalStorage();
  }

  exportFountain() {
    const fountain = this.store.exportToFountain();
    const blob = new Blob([fountain], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.store.script.title || 'screenplay'}.fountain`;
    a.click();
    URL.revokeObjectURL(url);
    this.closeCommandPalette();
  }

  exportPDF() {
    try {
      // Use the PDF exporter to create printable HTML
      pdfExporter.downloadAsHTML(this.store);
      
      // Show a message that the file will open in print preview
      // User can then choose to print to PDF or save as PDF
    } catch (e) {
      console.error('PDF export error:', e);
      // Fallback: export as Fountain
      this.exportFountain();
    }

    this.closeCommandPalette();
  }

  // Auto-save setup
  setupAutoSave() {
    setInterval(() => {
      if (this.store.state.isDirty) {
        this.store.saveToLocalStorage();
      }
    }, 5000);
  }
}

// Initialize app on load
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new ScreenplayApp();
  app.applyTheme();
});
