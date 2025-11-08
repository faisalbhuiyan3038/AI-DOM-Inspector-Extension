// Initialize default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    selectionMode: 'element',
    ancestorLevels: 50,
    includeChildren: -1,
    customPrompt: `I'm using DevTools in browser. I'm using the Elements tool to inspect an element. I will give you, below, the DOM structure where the element I am currenlty inspecting is located. I will provide the element itself and its ancestors, just like they appear in the DOM. I'll omit the rest of the DOM to keep it short. I will also give the list of CSS rules that apply to the elements that I'm providing in the DOM stucture. I want to ask you questions about this to fix the HTML/CSS issues that I'm facing. Please act as a friendly CSS expert who is willing to help me debug my issues. Whenever possible, provide fixes for the issues that I'm facing. If I'm asking questions about an element different than the one that's selected and you can't answer, please tell me. When I say "this element", "the element" or "current element", I mean the deepest element in the DOM tree.

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
