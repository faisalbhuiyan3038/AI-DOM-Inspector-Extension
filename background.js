// Initialize default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    selectionMode: 'element',
    ancestorLevels: 50,
    includeChildren: -1,
    customPrompt: `element copied by another tool that does the same job:

DOM structure:
{dom}

CSS rules:
{css}`
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: startSelection
  });
});

function startSelection() {
  chrome.runtime.sendMessage({ action: 'startSelection' });
}
