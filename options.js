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

// Use an async IIFE (Immediately Invoked Function Expression) to load settings
(async () => {
  try {
    const settings = await browser.storage.sync.get(DEFAULT_SETTINGS);
    document.querySelector(`input[name="selectionMode"][value="${settings.selectionMode}"]`).checked = true;
    document.getElementById('ancestorLevels').value = settings.ancestorLevels;
    document.getElementById('includeChildren').value = settings.includeChildren;
    document.getElementById('customPrompt').value = settings.customPrompt;
  } catch (error) {
    console.error("Error loading settings:", error);
  }
})();

// Save settings
document.getElementById('saveBtn').addEventListener('click', async () => {
  const settings = {
    selectionMode: document.querySelector('input[name="selectionMode"]:checked').value,
    ancestorLevels: parseInt(document.getElementById('ancestorLevels').value),
    includeChildren: parseInt(document.getElementById('includeChildren').value),
    customPrompt: document.getElementById('customPrompt').value
  };

  try {
    await browser.storage.sync.set(settings);
    showStatus('Settings saved successfully!');
  } catch (error) {
    console.error("Error saving settings:", error);
    showStatus('Failed to save settings', 'error');
  }
});

// Reset settings
document.getElementById('resetBtn').addEventListener('click', async () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    try {
      await browser.storage.sync.set(DEFAULT_SETTINGS);
      document.querySelector(`input[name="selectionMode"][value="${DEFAULT_SETTINGS.selectionMode}"]`).checked = true;
      document.getElementById('ancestorLevels').value = DEFAULT_SETTINGS.ancestorLevels;
      document.getElementById('includeChildren').value = DEFAULT_SETTINGS.includeChildren;
      document.getElementById('customPrompt').value = DEFAULT_SETTINGS.customPrompt;
      showStatus('Settings reset to defaults!');
    } catch (error) {
      console.error("Error resetting settings:", error);
      showStatus('Failed to reset settings', 'error');
    }
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