// Screenplay element types
const ELEMENT_TYPES = {
  'scene-heading': 'scene-heading',
  'action': 'action',
  'character': 'character',
  'dialogue': 'dialogue',
  'parenthetical': 'parenthetical',
  'transition': 'transition',
  'shot': 'shot',
};

// Element configuration
const ELEMENT_CONFIG = {
  'scene-heading': {
    label: 'Scene Heading',
    shortcut: '1',
    placeholder: 'INT./EXT. LOCATION - TIME',
    nextElement: 'action',
    autoUppercase: true,
  },
  'action': {
    label: 'Action',
    shortcut: '2',
    placeholder: 'Action description...',
    nextElement: 'action',
    autoUppercase: false,
  },
  'character': {
    label: 'Character',
    shortcut: '3',
    placeholder: 'CHARACTER NAME',
    nextElement: 'dialogue',
    autoUppercase: true,
  },
  'dialogue': {
    label: 'Dialogue',
    shortcut: '4',
    placeholder: 'Dialogue...',
    nextElement: 'character',
    autoUppercase: false,
  },
  'parenthetical': {
    label: 'Parenthetical',
    shortcut: '5',
    placeholder: '(emotion/direction)',
    nextElement: 'dialogue',
    autoUppercase: false,
  },
  'transition': {
    label: 'Transition',
    shortcut: '6',
    placeholder: 'CUT TO:',
    nextElement: 'scene-heading',
    autoUppercase: true,
  },
  'shot': {
    label: 'Shot',
    shortcut: '7',
    placeholder: 'ANGLE ON:',
    nextElement: 'action',
    autoUppercase: true,
  },
};

// Generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// Create element
function createElement(type, content = '', sceneId = null) {
  return {
    id: generateId(),
    type,
    content,
    sceneId,
  };
}

// Create scene
function createScene(headingElement, number) {
  return {
    id: generateId(),
    number,
    heading: headingElement.content,
    elementIds: [headingElement.id],
  };
}

// Calculate page count
function calculatePageCount(elements) {
  let lineCount = 0;

  for (const element of elements) {
    const contentLines = Math.ceil(element.content.length / 60) || 1;

    switch (element.type) {
      case 'scene-heading':
        lineCount += contentLines + 2;
        break;
      case 'action':
        lineCount += contentLines + 1;
        break;
      case 'character':
        lineCount += 1;
        break;
      case 'dialogue':
        lineCount += contentLines;
        break;
      case 'parenthetical':
        lineCount += 1;
        break;
      case 'transition':
        lineCount += 2;
        break;
      case 'shot':
        lineCount += 2;
        break;
    }
  }

  return Math.max(1, Math.ceil(lineCount / 55));
}

// Extract characters
function extractCharacters(elements) {
  const characters = new Map();
  let currentSceneId = null;

  for (const element of elements) {
    if (element.type === 'scene-heading') {
      currentSceneId = element.sceneId;
    }

    if (element.type === 'character' && element.content.trim()) {
      const name = element.content.trim().toUpperCase();
      const existing = characters.get(name);

      if (existing) {
        existing.dialogueCount++;
        if (currentSceneId && !existing.sceneAppearances.includes(currentSceneId)) {
          existing.sceneAppearances.push(currentSceneId);
        }
      } else {
        characters.set(name, {
          name,
          dialogueCount: 1,
          sceneAppearances: currentSceneId ? [currentSceneId] : [],
        });
      }
    }
  }

  return characters;
}

// Dialogue/action ratio
function getDialogueActionRatio(elements) {
  let dialogueChars = 0;
  let actionChars = 0;

  for (const element of elements) {
    if (element.type === 'dialogue') {
      dialogueChars += element.content.length;
    } else if (element.type === 'action') {
      actionChars += element.content.length;
    }
  }

  const total = dialogueChars + actionChars;
  if (total === 0) return { dialogue: 0, action: 0, ratio: '0:0' };

  const dialoguePercent = Math.round((dialogueChars / total) * 100);
  const actionPercent = 100 - dialoguePercent;

  return {
    dialogue: dialoguePercent,
    action: actionPercent,
    ratio: `${dialoguePercent}:${actionPercent}`,
  };
}

// Main store class
class ScreenplayStore {
  constructor() {
    this.script = {
      id: generateId(),
      title: 'Untitled Screenplay',
      author: '',
      elements: [createElement('scene-heading', 'INT. LOCATION - DAY')],
      scenes: [],
      characters: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.state = {
      activeElementId: this.script.elements[0]?.id || null,
      focusMode: false,
      leftPanelOpen: true,
      rightPanelOpen: true,
      isDirty: false,
      lastSaved: null,
    };

    this.listeners = [];
    this.loadFromLocalStorage();
  }

  // Listeners
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    for (const callback of this.listeners) {
      callback(this.getState());
    }
  }

  getState() {
    return {
      ...this.state,
      script: this.script,
    };
  }

  // Element operations
  addElement(type, afterId = null) {
    const newElement = createElement(type);
    
    if (afterId !== null) {
      const index = this.script.elements.findIndex(e => e.id === afterId);
      if (index !== -1) {
        this.script.elements.splice(index + 1, 0, newElement);
      } else {
        this.script.elements.push(newElement);
      }
    } else {
      this.script.elements.push(newElement);
    }

    this.state.activeElementId = newElement.id;
    this.markDirty();
    this.updateScenes();
    this.notify();
    return newElement.id;
  }

  updateElement(id, content) {
    const element = this.script.elements.find(e => e.id === id);
    if (element) {
      element.content = content;
      this.markDirty();
      this.updateCharacters();
      this.notify();
    }
  }

  setElementType(id, type) {
    const element = this.script.elements.find(e => e.id === id);
    if (element) {
      element.type = type;
      this.markDirty();
      this.updateScenes();
      this.updateCharacters();
      this.notify();
    }
  }

  deleteElement(id) {
    const index = this.script.elements.findIndex(e => e.id === id);
    if (index !== -1) {
      this.script.elements.splice(index, 1);
      
      // Set active to previous or next element
      if (this.state.activeElementId === id) {
        if (index > 0) {
          this.state.activeElementId = this.script.elements[index - 1].id;
        } else if (index < this.script.elements.length) {
          this.state.activeElementId = this.script.elements[index].id;
        } else {
          this.state.activeElementId = null;
        }
      }

      this.markDirty();
      this.updateScenes();
      this.updateCharacters();
      this.notify();
    }
  }

  setActiveElement(id) {
    this.state.activeElementId = id;
    this.notify();
  }

  // Scene management
  updateScenes() {
    this.script.scenes = [];
    let sceneNumber = 1;

    for (const element of this.script.elements) {
      if (element.type === 'scene-heading') {
        const scene = createScene(element, sceneNumber);
        element.sceneId = scene.id;
        this.script.scenes.push(scene);
        sceneNumber++;
      } else if (this.script.scenes.length > 0) {
        const currentScene = this.script.scenes[this.script.scenes.length - 1];
        if (!currentScene.elementIds.includes(element.id)) {
          currentScene.elementIds.push(element.id);
        }
        element.sceneId = currentScene.id;
      }
    }
  }

  // Character management
  updateCharacters() {
    this.script.characters = extractCharacters(this.script.elements);
  }

  // View toggles
  toggleFocusMode() {
    this.state.focusMode = !this.state.focusMode;
    this.notify();
  }

  toggleLeftPanel() {
    this.state.leftPanelOpen = !this.state.leftPanelOpen;
    this.notify();
  }

  toggleRightPanel() {
    this.state.rightPanelOpen = !this.state.rightPanelOpen;
    this.notify();
  }

  // Dirty/save state
  markDirty() {
    this.state.isDirty = true;
    this.script.updatedAt = new Date();
  }

  // Storage
  saveToLocalStorage() {
    const data = {
      script: this.script,
      state: this.state,
    };
    localStorage.setItem('screenplay-store', JSON.stringify(data));
    this.state.isDirty = false;
    this.state.lastSaved = new Date();
    this.notify();
  }

  loadFromLocalStorage() {
    const data = localStorage.getItem('screenplay-store');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.script = parsed.script;
        this.script.characters = new Map(Object.entries(parsed.script.characters || {}));
        this.state = parsed.state;
        this.updateScenes();
        this.updateCharacters();
      } catch (e) {
        console.error('Failed to load screenplay:', e);
      }
    } else {
      this.updateScenes();
      this.updateCharacters();
    }
  }

  // Export to Fountain format
  exportToFountain() {
    let fountain = '';

    if (this.script.title) {
      fountain += `Title: ${this.script.title}\n`;
    }
    if (this.script.author) {
      fountain += `Author: ${this.script.author}\n`;
    }

    fountain += '\n';

    for (const element of this.script.elements) {
      switch (element.type) {
        case 'scene-heading':
          fountain += `${element.content}\n`;
          break;
        case 'action':
          fountain += `${element.content}\n`;
          break;
        case 'character':
          fountain += `${element.content}\n`;
          break;
        case 'dialogue':
          fountain += `${element.content}\n`;
          break;
        case 'parenthetical':
          fountain += `${element.content}\n`;
          break;
        case 'transition':
          fountain += `${element.content}\n`;
          break;
        case 'shot':
          fountain += `${element.content}\n`;
          break;
      }
      fountain += '\n';
    }

    return fountain;
  }

  // Get stats
  getStats() {
    const wordCount = this.script.elements.reduce((count, el) => {
      return count + el.content.split(/\s+/).filter(w => w).length;
    }, 0);

    const pageCount = calculatePageCount(this.script.elements);
    const ratio = getDialogueActionRatio(this.script.elements);

    return {
      wordCount,
      pageCount,
      sceneCount: this.script.scenes.length,
      characterCount: this.script.characters.size,
      dialogueRatio: ratio.ratio,
    };
  }

  // Update title and author
  updateTitle(title) {
    this.script.title = title;
    this.markDirty();
    this.notify();
  }

  updateAuthor(author) {
    this.script.author = author;
    this.markDirty();
    this.notify();
  }
}

// Create singleton instance
const screenplayStore = new ScreenplayStore();
