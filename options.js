const DEFAULT_SETTINGS = {
  selectionMode: 'element',
  ancestorLevels: 50,
  includeChildren: -1,
  customPrompt: `element copied by another tool that does the same job:

DOM structure:
{dom}

CSS rules:
{css}`
};

// Load settings
chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  document.querySelector(`input[name="selectionMode"][value="${settings.selectionMode}"]`).checked = true;
  document.getElementById('ancestorLevels').value = settings.ancestorLevels;
  document.getElementById('includeChildren').value = settings.includeChildren;
  document.getElementById('customPrompt').value = settings.customPrompt;
});

// Save settings
document.getElementById('saveBtn').addEventListener('click', () => {
  const settings = {
    selectionMode: document.querySelector('input[name="selectionMode"]:checked').value,
    ancestorLevels: parseInt(document.getElementById('ancestorLevels').value),
    includeChildren: parseInt(document.getElementById('includeChildren').value),
    customPrompt: document.getElementById('customPrompt').value
  };

  chrome.storage.sync.set(settings, () => {
    showStatus('Settings saved successfully!');
  });
});

// Reset settings
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
      document.querySelector(`input[name="selectionMode"][value="${DEFAULT_SETTINGS.selectionMode}"]`).checked = true;
      document.getElementById('ancestorLevels').value = DEFAULT_SETTINGS.ancestorLevels;
      document.getElementById('includeChildren').value = DEFAULT_SETTINGS.includeChildren;
      document.getElementById('customPrompt').value = DEFAULT_SETTINGS.customPrompt;
      showStatus('Settings reset to defaults!');
    });
  }
});

function showStatus(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status success';
  status.style.display = 'block';

  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}
