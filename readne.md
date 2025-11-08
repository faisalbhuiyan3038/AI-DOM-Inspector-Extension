# AI DOM Inspector - Chrome Extension

A powerful Chrome extension that allows you to select elements or areas on any webpage and copy their DOM structure and CSS styling to your clipboard, formatted perfectly for providing context to AI tools.

## Features

- 🎯 **Element Selection**: Click to select any element on a webpage
- 📐 **Area Selection**: Click and drag to select multiple elements in a rectangular area
- 📦 **Ancestor Hierarchy**: Automatically includes parent elements for context (up to body)
- 🎨 **CSS Extraction**: Captures actual CSS rules from stylesheets (not computed styles)
- ✏️ **Customizable Prompts**: Add your own template text before the copied content
- ⚙️ **Flexible Settings**: Configure ancestor levels, children depth, and selection mode
- 🖱️ **Visual Feedback**: Highlighted overlay shows exactly what you're selecting
- 📋 **One-Click Copy**: Instantly copies formatted content to clipboard

## How to Use

### Basic Usage

1. **Click the Extension Icon** in your Chrome toolbar
2. **Click "Select Element"** button in the popup
3. **Choose your selection mode:**
   - **Element Mode**: Hover and click on any element
   - **Area Mode**: Click and drag to select a rectangular area
4. **The content is copied** to your clipboard automatically
5. **Paste anywhere** - the formatted content is ready to use!

### Selection Modes

#### Element Mode (Default)
- Hover over elements to see them highlighted with a blue border
- Click on any element to copy it along with its ancestors
- Best for selecting specific components or sections

#### Area Mode
- Click and drag to draw a selection box (shown with dashed blue border)
- All elements completely within the box will be captured
- The common ancestor and all selected elements are included
- Best for selecting multiple related elements at once
- Shows area dimensions while dragging

### Keyboard Shortcuts

- **ESC**: Cancel element selection mode

### Settings (Customization)

Click the "Settings" button or right-click the extension icon → Options to access:

#### Selection Mode
- **Single Element**: Select individual elements (default)
- **Area Selection**: Select a rectangular area (coming soon)

#### Ancestor Levels (0-20)
- **Default: 3** - Includes the selected element plus 3 parent elements
- **0**: Only the selected element
- **Higher values**: More parent context

#### Children Depth
- **Default: -1** (all children)
- **0**: No children
- **Positive number**: Specific depth of children

#### Custom Prompt Template
Customize the text that appears before your copied content. Available variables:
- `{dom}` - The HTML structure
- `{css}` - The CSS styles
- `{url}` - Current page URL
- `{timestamp}` - Current date/time

**Default Template:**
```

DOM structure:
{dom}

CSS rules:
{css}
```

## Example Output

When you select an element, you'll get something like:

```

DOM structure:
`html
<div class="container">
  <section class="card">
    <h2 class="title">Hello World</h2>
  </section>
</div>
`

CSS rules:
`css
/** For the <div class="container"> element **/
.container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
}

/** For the <section class="card"> element **/
.card {
  padding: 20px;
  border-radius: 8px;
  background: white;
}

/** For the <h2 class="title"> element **/
.title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
}
`
```

## Tips for Best Results

1. **For AI Context**: Set ancestor levels to 2-4 for good context without overwhelming the AI
2. **For Debugging**: Use higher ancestor levels to see more page structure
3. **For Specific Elements**: Set ancestor levels to 0 to copy just one element
4. **Custom Prompts**: Add specific instructions for your AI tool in the prompt template

## Troubleshooting

**Extension not working?**
- Refresh the page and try again
- Some pages (like chrome:// URLs) can't be accessed by extensions
- Check that the extension is enabled in `chrome://extensions/`

**Nothing copied to clipboard?**
- Check your browser's clipboard permissions
- Try clicking the element again
- Look for error messages in the notification

**Styles look wrong?**
- The extension captures computed styles, which include all inherited properties
- Some dynamic styles may not be captured if they depend on JavaScript state

## Privacy & Permissions

This extension:
- ✅ Only runs when you activate it
- ✅ Doesn't collect or transmit any data
- ✅ Doesn't modify web pages (only reads them)
- ✅ Settings are stored locally in Chrome sync storage

Required permissions:
- `activeTab`: To access the current page's content
- `storage`: To save your settings
- `scripting`: To inject the selection interface

## Development

Want to modify the extension? All files are included:
- `manifest.json`: Extension configuration
- `popup.*`: Extension popup interface
- `options.*`: Settings page
- `content.*`: Page interaction logic
- `background.js`: Extension background service

## License

Free to use and modify for personal or commercial projects.

## Support

Having issues? Check that:
1. Extension is loaded and enabled
2. You're not on a restricted page (chrome://, etc.)
3. Page has been refreshed after installing
4. Developer mode is enabled if using unpacked extension
