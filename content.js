let isSelecting = false;
let overlay = null;
let tooltip = null;
let settings = {};
let areaSelection = {
  isDrawing: false,
  startX: 0,
  startY: 0,
  selectionBox: null
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startSelection') {
    chrome.storage.sync.get({
      selectionMode: 'element',
      ancestorLevels: 50,
      includeChildren: -1,
      customPrompt: "I'm using DevTools in browser. I'm using the Elements tool to inspect an element. I will give you, below, the DOM structure where the element I am currenlty inspecting is located. I will provide the element itself and its ancestors, just like they appear in the DOM. I'll omit the rest of the DOM to keep it short. I will also give the list of CSS rules that apply to the elements that I'm providing in the DOM stucture. I want to ask you questions about this to fix the HTML/CSS issues that I'm facing. Please act as a friendly CSS expert who is willing to help me debug my issues. Whenever possible, provide fixes for the issues that I'm facing. If I'm asking questions about an element different than the one that's selected and you can't answer, please tell me. When I say 'this element', 'the element' or 'current element', I mean the deepest element in the DOM tree.\n\nDOM structure:\n{dom}\n\nCSS rules:\n{css}"
    }, (loadedSettings) => {
      settings = loadedSettings;
      startSelection();
      sendResponse({ success: true });
    });
    return true;
  }
});

function startSelection() {
  if (isSelecting) return;

  isSelecting = true;
  document.body.classList.add('element-copier-cursor');

  // Create overlay for element mode
  overlay = document.createElement('div');
  overlay.className = 'element-copier-overlay';
  document.body.appendChild(overlay);

  // Create tooltip
  tooltip = document.createElement('div');
  tooltip.className = 'element-copier-tooltip';
  tooltip.textContent = settings.selectionMode === 'area' ? 'Click and drag to select area' : 'Click to select element';
  document.body.appendChild(tooltip);

  if (settings.selectionMode === 'area') {
    document.addEventListener('mousedown', handleAreaMouseDown);
    document.addEventListener('mousemove', handleAreaMouseMove);
    document.addEventListener('mouseup', handleAreaMouseUp);
  } else {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
  }

  document.addEventListener('keydown', handleKeyDown);
}

// Element selection handlers
function handleMouseMove(e) {
  if (!isSelecting || settings.selectionMode === 'area') return;

  const target = e.target;
  if (target === overlay || target === tooltip) return;

  const rect = target.getBoundingClientRect();

  overlay.style.left = rect.left + window.scrollX + 'px';
  overlay.style.top = rect.top + window.scrollY + 'px';
  overlay.style.width = rect.width + 'px';
  overlay.style.height = rect.height + 'px';

  tooltip.textContent = getElementSelector(target);
  tooltip.style.left = e.pageX + 15 + 'px';
  tooltip.style.top = e.pageY + 15 + 'px';
}

function handleClick(e) {
  if (!isSelecting || settings.selectionMode === 'area') return;

  e.preventDefault();
  e.stopPropagation();

  const target = e.target;
  if (target === overlay || target === tooltip) return;

  copyElementData(target);
  stopSelection();
}

// Area selection handlers
function handleAreaMouseDown(e) {
  if (!isSelecting || settings.selectionMode !== 'area') return;

  e.preventDefault();

  areaSelection.isDrawing = true;
  areaSelection.startX = e.pageX;
  areaSelection.startY = e.pageY;

  // Create selection box
  if (!areaSelection.selectionBox) {
    areaSelection.selectionBox = document.createElement('div');
    areaSelection.selectionBox.className = 'element-copier-area-box';
    document.body.appendChild(areaSelection.selectionBox);
  }

  areaSelection.selectionBox.style.left = areaSelection.startX + 'px';
  areaSelection.selectionBox.style.top = areaSelection.startY + 'px';
  areaSelection.selectionBox.style.width = '0px';
  areaSelection.selectionBox.style.height = '0px';
  areaSelection.selectionBox.style.display = 'block';

  // Hide element overlay and tooltip while drawing
  overlay.style.display = 'none';
  tooltip.style.display = 'none';
}

function handleAreaMouseMove(e) {
  if (!isSelecting || settings.selectionMode !== 'area') return;

  if (areaSelection.isDrawing) {
    e.preventDefault();

    const currentX = e.pageX;
    const currentY = e.pageY;

    const width = Math.abs(currentX - areaSelection.startX);
    const height = Math.abs(currentY - areaSelection.startY);
    const left = Math.min(currentX, areaSelection.startX);
    const top = Math.min(currentY, areaSelection.startY);

    areaSelection.selectionBox.style.left = left + 'px';
    areaSelection.selectionBox.style.top = top + 'px';
    areaSelection.selectionBox.style.width = width + 'px';
    areaSelection.selectionBox.style.height = height + 'px';

    tooltip.textContent = `Area: ${Math.round(width)}x${Math.round(height)}px`;
    tooltip.style.left = e.pageX + 15 + 'px';
    tooltip.style.top = e.pageY + 15 + 'px';
    tooltip.style.display = 'block';
  } else {
    // Show preview on hover
    tooltip.textContent = 'Click and drag to select area';
    tooltip.style.left = e.pageX + 15 + 'px';
    tooltip.style.top = e.pageY + 15 + 'px';
    tooltip.style.display = 'block';
  }
}

function handleAreaMouseUp(e) {
  if (!isSelecting || settings.selectionMode !== 'area' || !areaSelection.isDrawing) return;

  e.preventDefault();

  areaSelection.isDrawing = false;

  // Get the bounding box
  const box = areaSelection.selectionBox.getBoundingClientRect();

  // Find all elements within this area
  const elementsInArea = getElementsInArea(box);

  if (elementsInArea.length > 0) {
    copyAreaData(elementsInArea, box);
  } else {
    showNotification('No elements found in selected area', 'error');
  }

  stopSelection();
}

function getElementsInArea(box) {
  const allElements = document.querySelectorAll('body *');
  const elementsInArea = [];

  for (let element of allElements) {
    // Skip our own extension elements
    if (element.classList.contains('element-copier-overlay') ||
      element.classList.contains('element-copier-tooltip') ||
      element.classList.contains('element-copier-area-box') ||
      element.classList.contains('element-copier-notification')) {
      continue;
    }

    const rect = element.getBoundingClientRect();

    // Check if element is within the selection box
    if (rect.left >= box.left &&
      rect.right <= box.right &&
      rect.top >= box.top &&
      rect.bottom <= box.bottom) {
      elementsInArea.push(element);
    }
  }

  return elementsInArea;
}

function copyAreaData(elements, box) {
  // Find the common ancestor of all selected elements
  const commonAncestor = findCommonAncestor(elements);

  if (!commonAncestor) {
    showNotification('Could not find common ancestor', 'error');
    return;
  }

  // Get ancestors of the common ancestor
  const ancestors = settings.ancestorLevels > 0
    ? getAncestors(commonAncestor, settings.ancestorLevels + 1)
    : [commonAncestor];

  // Build DOM structure
  let domHTML = '`html\n';
  domHTML += buildNestedHTML(ancestors, commonAncestor, -1);
  domHTML += '\n`';

  // Build CSS for all elements in the area
  let cssText = '`css\n';
  const allElementsToStyle = [...ancestors, ...elements];
  const uniqueElements = [...new Set(allElementsToStyle)];

  uniqueElements.forEach(element => {
    const rules = getAllAppliedStyles(element);

    cssText += `/** For the <${element.tagName.toLowerCase()}${getAttributesString(element)}> element **/\n`;

    if (Object.keys(rules).length > 0) {
      cssText += formatCSS(rules) + '\n';
    } else {
      cssText += `/* No stylesheet rules found for this element */\n\n`;
    }
  });
  cssText += '`';

  // Format final output
  let output = settings.customPrompt
    .replace('{dom}', domHTML)
    .replace('{css}', cssText)
    .replace('{url}', window.location.href)
    .replace('{timestamp}', new Date().toISOString());

  // Copy to clipboard
  navigator.clipboard.writeText(output).then(() => {
    showNotification(`✓ Copied ${elements.length} elements to clipboard!`, 'success');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showNotification('✗ Failed to copy', 'error');
  });
}

function findCommonAncestor(elements) {
  if (elements.length === 0) return null;
  if (elements.length === 1) return elements[0];

  // Get all ancestors for the first element
  let commonAncestor = elements[0];

  while (commonAncestor) {
    // Check if this ancestor contains all elements
    const containsAll = elements.every(el => commonAncestor.contains(el));

    if (containsAll) {
      return commonAncestor;
    }

    commonAncestor = commonAncestor.parentElement;
  }

  return document.body;
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    stopSelection();
    showNotification('Selection cancelled', 'error');
  }
}

function stopSelection() {
  isSelecting = false;
  document.body.classList.remove('element-copier-cursor');

  if (overlay) {
    overlay.remove();
    overlay = null;
  }

  if (tooltip) {
    tooltip.remove();
    tooltip = null;
  }

  if (areaSelection.selectionBox) {
    areaSelection.selectionBox.remove();
    areaSelection.selectionBox = null;
  }

  areaSelection.isDrawing = false;

  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleClick);
  document.removeEventListener('mousedown', handleAreaMouseDown);
  document.removeEventListener('mousemove', handleAreaMouseMove);
  document.removeEventListener('mouseup', handleAreaMouseUp);
  document.removeEventListener('keydown', handleKeyDown);
}

function getElementSelector(el) {
  if (el.id) return `#${el.id}`;
  if (el.className) {
    const classes = Array.from(el.classList).filter(c => !c.startsWith('element-copier-'));
    if (classes.length) return `${el.tagName.toLowerCase()}.${classes[0]}`;
  }
  return el.tagName.toLowerCase();
}

function getAncestors(el, levels) {
  const ancestors = [];
  let current = el;
  let count = 0;

  // Go up to body or specified levels
  while (current && current !== document.documentElement && count < levels) {
    ancestors.unshift(current);
    current = current.parentElement;
    count++;
  }

  return ancestors;
}

function buildNestedHTML(elements, targetElement, childDepth) {
  if (elements.length === 0) return '';

  const [current, ...rest] = elements;
  const isTarget = current === targetElement;
  const tag = current.tagName.toLowerCase();
  const attrs = getAttributesString(current);

  let html = `<${tag}${attrs}>`;

  if (rest.length > 0) {
    // Continue with nested structure
    html += buildNestedHTML(rest, targetElement, childDepth);
  } else if (isTarget && childDepth !== 0) {
    // This is the target element, include its children
    const children = Array.from(current.children);
    children.forEach(child => {
      html += getElementHTML(child, childDepth === -1 ? -1 : childDepth - 1);
    });
  }

  html += `</${tag}>`;
  return html;
}

function getElementHTML(el, depth) {
  if (depth === 0) {
    return `<${el.tagName.toLowerCase()}${getAttributesString(el)}></${el.tagName.toLowerCase()}>`;
  }

  let html = `<${el.tagName.toLowerCase()}${getAttributesString(el)}>`;

  if (depth === -1 || depth > 0) {
    const children = Array.from(el.children);
    children.forEach(child => {
      html += getElementHTML(child, depth === -1 ? -1 : depth - 1);
    });
  }

  html += `</${el.tagName.toLowerCase()}>`;
  return html;
}

function getAttributesString(el) {
  const attrs = Array.from(el.attributes)
    .filter(attr => !attr.name.startsWith('__') && attr.name !== 'bis_skin_checked')
    .map(attr => `${attr.name}="${attr.value}"`)
    .join(' ');
  return attrs ? ' ' + attrs : '';
}

function getAllAppliedStyles(el) {
  const matchedRules = [];
  const sheets = document.styleSheets;

  // Get all CSS rules that match this element
  for (let sheet of sheets) {
    try {
      if (!sheet.cssRules) continue;

      for (let rule of sheet.cssRules) {
        if (rule.type === CSSRule.STYLE_RULE) {
          try {
            if (el.matches(rule.selectorText)) {
              // Store each property from this rule
              for (let prop of rule.style) {
                const value = rule.style.getPropertyValue(prop);
                if (value) {
                  matchedRules.push({
                    selector: rule.selectorText,
                    property: prop,
                    value: value,
                    specificity: getSpecificity(rule.selectorText)
                  });
                }
              }
            }
          } catch (e) {
            // Some selectors like ::-webkit-* might fail
            continue;
          }
        }
      }
    } catch (e) {
      // CORS issues with external stylesheets
      continue;
    }
  }

  // Group by selector
  const grouped = {};
  matchedRules.forEach(rule => {
    if (!grouped[rule.selector]) {
      grouped[rule.selector] = [];
    }
    grouped[rule.selector].push(`${rule.property}: ${rule.value}`);
  });

  return grouped;
}

function getSpecificity(selector) {
  // Simple specificity calculation (not perfect but good enough)
  let a = 0, b = 0, c = 0;

  // Count IDs
  a = (selector.match(/#/g) || []).length;
  // Count classes, attributes, pseudo-classes
  b = (selector.match(/\.|:\w+|\[/g) || []).length;
  // Count elements and pseudo-elements
  c = (selector.match(/^[a-z]+|[ >+~][a-z]+/gi) || []).length;

  return a * 100 + b * 10 + c;
}

function formatCSS(rules) {
  let css = '';

  for (let [selector, properties] of Object.entries(rules)) {
    css += `${selector} {\n`;
    properties.forEach(prop => {
      css += `  ${prop};\n`;
    });
    css += `}\n\n`;
  }

  return css.trim();
}

function copyElementData(el) {
  const elements = settings.ancestorLevels > 0
    ? getAncestors(el, settings.ancestorLevels + 1)
    : [el];

  // Build DOM structure with proper nesting
  let domHTML = '`html\n';
  domHTML += buildNestedHTML(elements, el, settings.includeChildren);
  domHTML += '\n`';

  // Build CSS - collect all rules for all elements
  let cssText = '`css\n';
  elements.forEach(element => {
    const rules = getAllAppliedStyles(element);

    // Add comment for context
    cssText += `/** For the <${element.tagName.toLowerCase()}${getAttributesString(element)}> element **/\n`;

    // Add all matching CSS rules
    if (Object.keys(rules).length > 0) {
      cssText += formatCSS(rules) + '\n';
    } else {
      // Fallback if no stylesheet rules found
      cssText += `/* No stylesheet rules found for this element */\n\n`;
    }
  });
  cssText += '`';

  // Format final output
  let output = settings.customPrompt
    .replace('{dom}', domHTML)
    .replace('{css}', cssText)
    .replace('{url}', window.location.href)
    .replace('{timestamp}', new Date().toISOString());

  // Copy to clipboard
  navigator.clipboard.writeText(output).then(() => {
    showNotification('✓ Copied to clipboard!', 'success');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showNotification('✗ Failed to copy', 'error');
  });
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `element-copier-notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
