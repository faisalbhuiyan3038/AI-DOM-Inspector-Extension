document.getElementById('selectElement').addEventListener('click', async () => {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    
    // Send the message and await a response (or for it to complete)
    await browser.tabs.sendMessage(tab.id, { action: 'startSelection' });
    
    // Close the popup window
    window.close();
  } catch (error) {
    // This 'catch' block replaces the 'chrome.runtime.lastError' check
    console.error("Error starting selection:", error.message);
    showStatus('Please refresh the page and try again', 'error');
  }
});

document.getElementById('openOptions').addEventListener('click', () => {
  browser.runtime.openOptionsPage();
});

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';

  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}