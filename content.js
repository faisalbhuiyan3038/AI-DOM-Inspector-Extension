let isSelecting = false;
let overlay = null;
let tooltip = null;
let settings = {};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startSelection') {
    chrome.storage.sync.get({
      selectionMode: 'element',
      ancestorLevels: 50,
      includeChildren: -1,
      customPrompt: 'element copied by another tool that does the same job:\n\nDOM structure:\n{dom}\n\nCSS rules:\n{css}'
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

  // Create overlay
  overlay = document.createElement('div');
  overlay.className = 'element-copier-overlay';
  document.body.appendChild(overlay);

  // Create tooltip
  tooltip = document.createElement('div');
  tooltip.className = 'element-copier-tooltip';
  document.body.appendChild(tooltip);

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeyDown);
}

function handleMouseMove(e) {
  if (!isSelecting) return;

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
  if (!isSelecting) return;

  e.preventDefault();
  e.stopPropagation();

  const target = e.target;
  if (target === overlay || target === tooltip) return;

  copyElementData(target);
  stopSelection();
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

  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleClick);
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
