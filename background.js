console.log('[background.js] Script loaded');

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('[background.js] Extension installed or updated');
});

// Track key states
const keyStates = {
  zoomKey: false,
  arrowKey: false
};

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[background.js] Message received from content script:', message);
  
  // Handle key release messages
  if (message.type === "KEY_RELEASED") {
    if (message.command === "zoom_in") {
      keyStates.zoomKey = false;
      console.log('[background.js] Zoom key released, state:', keyStates.zoomKey);
      
      // Send zoom_out command to the content script
      if (sender.tab && sender.tab.id) {
        chrome.tabs.sendMessage(sender.tab.id, {type: "MX_MASTER_ACTION", command: "zoom_out"}, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[background.js] Error sending zoom_out message:', chrome.runtime.lastError.message);
          } else {
            console.log('[background.js] Response from content script for zoom_out:', response);
          }
        });
      }
    } else if (message.command === "start_arrow_draw") {
      keyStates.arrowKey = false;
      console.log('[background.js] Arrow key released, state:', keyStates.arrowKey);
      
      // Send stop_arrow_draw command to the content script
      if (sender.tab && sender.tab.id) {
        chrome.tabs.sendMessage(sender.tab.id, {type: "MX_MASTER_ACTION", command: "stop_arrow_draw"}, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[background.js] Error sending stop_arrow_draw message:', chrome.runtime.lastError.message);
          } else {
            console.log('[background.js] Response from content script for stop_arrow_draw:', response);
          }
        });
      }
    }
    
    sendResponse({status: "key release handled"});
    return true; // Indicates we'll send a response asynchronously
  }
  
  return false; // Let other listeners handle this message
});

// Function to check if content script is ready
function checkContentScriptReady(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "PING" }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('[background.js] Content script not ready yet:', chrome.runtime.lastError.message);
        resolve(false);
      } else if (response && response.status === "PONG") {
        console.log('[background.js] Content script is ready');
        resolve(true);
      } else {
        console.log('[background.js] Content script not ready, unknown response');
        resolve(false);
      }
    });
  });
}

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  console.log('[background.js] Command received:', command);
  
  try {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    console.log('[background.js] Active tabs found:', tabs);
    
    if (tabs.length === 0) {
      console.log('[background.js] No active tab found.');
      return;
    }
    
    const activeTab = tabs[0];
    if (!activeTab || !activeTab.id) {
      console.error('[background.js] No active tab with a valid ID found.');
      return;
    }
    
    // Check if content script is ready
    const isReady = await checkContentScriptReady(activeTab.id);
    if (!isReady) {
      console.log('[background.js] Content script not ready, injecting it');
      // Try to inject the content script
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js']
        });
        console.log('[background.js] Content script injected successfully');
      } catch (err) {
        console.error('[background.js] Failed to inject content script:', err);
        return;
      }
    }
    
    // For zoom_in command, we'll set up a listener for the key release
    if (command === "zoom_in") {
      keyStates.zoomKey = true;
      console.log('[background.js] Zoom key pressed, state:', keyStates.zoomKey);
      
      // We need to inject a content script to listen for key release
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
            // Set up a one-time key release listener in the content script
            const handleKeyUp = (event) => {
              // Check if it's the zoom key combination being released (Ctrl+Shift+Z)
              if ((event.key === 'Z' || event.key === 'z') && event.ctrlKey && event.shiftKey) {
                // Send message back to background script that key was released
                chrome.runtime.sendMessage({type: "KEY_RELEASED", command: "zoom_in"});
                // Remove this listener after handling the key release
                window.removeEventListener('keyup', handleKeyUp);
              }
            };
            
            // Add the keyup listener
            window.addEventListener('keyup', handleKeyUp);
          }
        });
        console.log('[background.js] Key release listener injected');
      } catch (err) {
        console.error('[background.js] Failed to inject key release listener:', err);
      }
    }
    // For start_arrow_draw command, we'll also set up a listener for the key release
    else if (command === "start_arrow_draw") {
      keyStates.arrowKey = true;
      console.log('[background.js] Arrow key pressed, state:', keyStates.arrowKey);
      
      // We need to inject a content script to listen for key release
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
            // Set up a one-time key release listener in the content script
            const handleKeyUp = (event) => {
              console.log('[content.js] Key released:', event.key, 'Ctrl:', event.ctrlKey, 'Shift:', event.shiftKey);
              // Check if it's the arrow key combination being released (Ctrl+Shift+L)
              if ((event.key === 'L' || event.key === 'l') && event.ctrlKey && event.shiftKey) {
                console.log('[content.js] Arrow key combination released');
                // Send message back to background script that key was released
                chrome.runtime.sendMessage({type: "KEY_RELEASED", command: "start_arrow_draw"});
                // Remove this listener after handling the key release
                window.removeEventListener('keyup', handleKeyUp);
              }
            };
            
            // Add the keyup listener
            window.addEventListener('keyup', handleKeyUp);
          }
        });
        console.log('[background.js] Arrow key release listener injected');
      } catch (err) {
        console.error('[background.js] Failed to inject arrow key release listener:', err);
      }
    }
    
    // Send the command to the content script
    console.log(`[background.js] Sending message to tab ${activeTab.id}:`, {type: "MX_MASTER_ACTION", command: command});
    chrome.tabs.sendMessage(activeTab.id, {type: "MX_MASTER_ACTION", command: command}, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[background.js] Error sending message:', chrome.runtime.lastError.message);
      } else {
        console.log('[background.js] Response from content script:', response);
      }
    });
  } catch (error) {
    console.error('[background.js] Error processing command:', error);
  }
});