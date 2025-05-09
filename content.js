(() => {
  console.log('[content.js] Script loaded');
  
  // State variables
  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let arrowCanvas = null;
  let ctx = null;
  let isInitialized = false;
  let arrowKeyListener = null;
  
  // Initialize function to ensure DOM is ready
  function initialize() {
    if (isInitialized) return;
    console.log('[content.js] Initializing');
    
    // Track last mouse position globally
    window.addEventListener("mousemove", (e) => {
      window.lastMouseEvent = e;
    });
    
    isInitialized = true;
    console.log('[content.js] Initialization complete');
  }
  
  // Create canvas for arrow drawing
  function createCanvas() {
    console.log('[content.js] createCanvas called');
    
    // Make sure body exists
    if (!document.body) {
      console.error('[content.js] Document body not available');
      return false;
    }
    
    arrowCanvas = document.createElement("canvas");
    arrowCanvas.style.position = "fixed";
    arrowCanvas.style.top = "0";
    arrowCanvas.style.left = "0";
    arrowCanvas.style.width = "100%";
    arrowCanvas.style.height = "100%";
    arrowCanvas.style.pointerEvents = "none";
    arrowCanvas.style.zIndex = "2147483647"; // max z-index
    arrowCanvas.width = window.innerWidth;
    arrowCanvas.height = window.innerHeight;
    document.body.appendChild(arrowCanvas);
    ctx = arrowCanvas.getContext("2d");
    return true;
  }
  
  // Clear the canvas
  function clearCanvas() {
    console.log('[content.js] clearCanvas called');
    if (ctx) {
      ctx.clearRect(0, 0, arrowCanvas.width, arrowCanvas.height);
    }
  }
  
  function drawArrow(fromX, fromY, toX, toY) {
  // console.log('[content.js] drawArrow called with:', fromX, fromY, toX, toY); // Potencjalnie zbyt dużo logów
      clearCanvas();
  console.log('[content.js] clearCanvas called after mouseup');
      const headlen = 45; // Much larger arrowhead (was 30)
      const dx = toX - fromX;
      const dy = toY - fromY;
      const angle = Math.atan2(dy, dx);
  
      // Draw the arrow shaft with much thicker width
      ctx.shadowColor = "transparent"; // Ensure no shadow for clean drawing
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ff0000"; // Bright red
      ctx.lineWidth = 12; // Much thicker line width
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
  
      // Draw the arrow head with increased size - no blur
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.lineTo(toX, toY);
      ctx.fillStyle = "#ff0000"; // Bright red
      ctx.fill();
      
      // Add a stronger stroke to the arrowhead for better definition
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Add a slight outline in a darker red for better visibility against light backgrounds
      ctx.strokeStyle = "#cc0000";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  
    // Track zoom state
  let isZoomed = false;
  let originalScale = 1;
  let zoomOriginX = 0;
  let zoomOriginY = 0;
  let spotlightOverlay = null;
  
  // Create a spotlight overlay element with a clear magnified center
  function createSpotlightOverlay(x, y, width = 300, height = 200) {
    // Remove any existing overlay
    removeSpotlightOverlay();
    
    // Create a container for our spotlight system
    const container = document.createElement('div');
    container.id = 'mx-master-spotlight-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '2147483646'; // Just below max z-index
    container.style.pointerEvents = 'none'; // Allow clicks to pass through
    
    // Calculate the spotlight rectangle coordinates
    const left = Math.round(x - width / 2);
    const top = Math.round(y - height / 2);
    const right = left + width;
    const bottom = top + height;
    const borderRadius = 15; // Rounded corners
    
    // Create the main blur overlay
    const blurOverlay = document.createElement('div');
    blurOverlay.style.position = 'absolute';
    blurOverlay.style.top = '0';
    blurOverlay.style.left = '0';
    blurOverlay.style.width = '100%';
    blurOverlay.style.height = '100%';
    blurOverlay.style.backdropFilter = 'blur(3px)';
    blurOverlay.style.webkitBackdropFilter = 'blur(3px)';
    blurOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    
    // Create four separate divs for the blurred areas
    // This approach ensures there's a blur effect outside the spotlight
    
    // Top section
    const topDiv = document.createElement('div');
    topDiv.style.position = 'absolute';
    topDiv.style.top = '0';
    topDiv.style.left = '0';
    topDiv.style.width = '100%';
    topDiv.style.height = `${Math.max(0, top)}px`;
    topDiv.style.backdropFilter = 'blur(3px)';
    topDiv.style.webkitBackdropFilter = 'blur(3px)';
    topDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    
    // Bottom section
    const bottomDiv = document.createElement('div');
    bottomDiv.style.position = 'absolute';
    bottomDiv.style.top = `${bottom}px`;
    bottomDiv.style.left = '0';
    bottomDiv.style.width = '100%';
    bottomDiv.style.height = `calc(100% - ${bottom}px)`;
    bottomDiv.style.backdropFilter = 'blur(3px)';
    bottomDiv.style.webkitBackdropFilter = 'blur(3px)';
    bottomDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    
    // Left section (middle strip)
    const leftDiv = document.createElement('div');
    leftDiv.style.position = 'absolute';
    leftDiv.style.top = `${top}px`;
    leftDiv.style.left = '0';
    leftDiv.style.width = `${left}px`;
    leftDiv.style.height = `${height}px`;
    leftDiv.style.backdropFilter = 'blur(3px)';
    leftDiv.style.webkitBackdropFilter = 'blur(3px)';
    leftDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    
    // Right section (middle strip)
    const rightDiv = document.createElement('div');
    rightDiv.style.position = 'absolute';
    rightDiv.style.top = `${top}px`;
    rightDiv.style.left = `${right}px`;
    rightDiv.style.width = `calc(100% - ${right}px)`;
    rightDiv.style.height = `${height}px`;
    rightDiv.style.backdropFilter = 'blur(3px)';
    rightDiv.style.webkitBackdropFilter = 'blur(3px)';
    rightDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    
    // Create a clear window with animated seafoam green border
    const clearWindow = document.createElement('div');
    clearWindow.style.position = 'absolute';
    clearWindow.style.top = `${top}px`;
    clearWindow.style.left = `${left}px`;
    clearWindow.style.width = `${width}px`;
    clearWindow.style.height = `${height}px`;
    clearWindow.style.borderRadius = `${borderRadius}px`;
    clearWindow.style.backgroundColor = 'transparent';
    clearWindow.style.boxShadow = '0 0 15px 5px rgba(255, 255, 255, 0.3)';
    
    // Create animated border with color chasing effect
    const borderWidth = 8; // Much thicker border
    // Create a container for the border to ensure proper positioning
    const borderContainer = document.createElement('div');
    borderContainer.style.position = 'absolute';
    borderContainer.style.top = `${top - borderWidth}px`;
    borderContainer.style.left = `${left - borderWidth}px`;
    borderContainer.style.width = `${width + (borderWidth * 2)}px`;
    borderContainer.style.height = `${height + (borderWidth * 2)}px`;
    borderContainer.style.padding = '0';
    borderContainer.style.margin = '0';
    borderContainer.style.overflow = 'hidden';
    
    // Create the actual border element with fixed dimensions
    const animatedBorder = document.createElement('div');
    animatedBorder.style.position = 'absolute';
    animatedBorder.style.top = '0';
    animatedBorder.style.left = '0';
    animatedBorder.style.width = '100%';
    animatedBorder.style.height = '100%';
    animatedBorder.style.borderRadius = `${borderRadius}px`;
    animatedBorder.style.boxShadow = '0 0 15px 3px rgba(0, 230, 184, 0.6)';
    
    // Add the border to its container
    borderContainer.appendChild(animatedBorder);
    
    // Use gradient border with animation for the chasing effect
    // Add a unique ID to ensure we don't get conflicts with multiple spotlights
    const borderID = 'border-' + Date.now();
    animatedBorder.id = borderID;
    
    // Add animation keyframes
    const keyframes = `
      @keyframes borderPulse {
        0% { opacity: 0.8; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.03); }
        100% { opacity: 0.8; transform: scale(1); }
      }
      
      @keyframes gradientMove {
        0% {
          border-image: linear-gradient(
            0deg,
            #00e6b8, #3399ff, #ff3366, #ffcc00, #33cc33, #00e6b8
          ) 1;
        }
        20% {
          border-image: linear-gradient(
            72deg,
            #00e6b8, #3399ff, #ff3366, #ffcc00, #33cc33, #00e6b8
          ) 1;
        }
        40% {
          border-image: linear-gradient(
            144deg,
            #00e6b8, #3399ff, #ff3366, #ffcc00, #33cc33, #00e6b8
          ) 1;
        }
        60% {
          border-image: linear-gradient(
            216deg,
            #00e6b8, #3399ff, #ff3366, #ffcc00, #33cc33, #00e6b8
          ) 1;
        }
        80% {
          border-image: linear-gradient(
            288deg,
            #00e6b8, #3399ff, #ff3366, #ffcc00, #33cc33, #00e6b8
          ) 1;
        }
        100% {
          border-image: linear-gradient(
            360deg,
            #00e6b8, #3399ff, #ff3366, #ffcc00, #33cc33, #00e6b8
          ) 1;
        }
      }
    `;
    
    // Add the border style - using border-image-slice to ensure consistent border width
    const borderStyle = `
      #${borderID} {
        border: ${borderWidth}px solid transparent;
        border-image: linear-gradient(
          0deg,
          #00e6b8, #3399ff, #ff3366, #ffcc00, #33cc33, #00e6b8
        ) 1 stretch;
        border-image-slice: 1;
        box-sizing: border-box;
        animation: borderPulse 2s infinite ease-in-out, gradientMove 3s infinite linear;
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = keyframes + borderStyle;
    document.head.appendChild(style);
    
    // Add elements to container
    container.appendChild(topDiv);
    container.appendChild(bottomDiv);
    container.appendChild(leftDiv);
    container.appendChild(rightDiv);
    container.appendChild(clearWindow);
    container.appendChild(borderContainer);
    
    // Add to document
    document.body.appendChild(container);
    
    // Set up mouse tracking
    setupSpotlightTracking();
    
    // Store reference to the overlay
    spotlightOverlay = container;
    
    return container;
  }
  
  // Remove spotlight overlay
  function removeSpotlightOverlay() {
    if (spotlightOverlay) {
      removeSpotlightTracking();
      spotlightOverlay.remove();
      spotlightOverlay = null;
    }
  }
  
  // Track mouse movement for spotlight
  function setupSpotlightTracking() {
    window.addEventListener('mousemove', updateSpotlightPosition);
  }
  
  // Remove spotlight tracking
  function removeSpotlightTracking() {
    window.removeEventListener('mousemove', updateSpotlightPosition);
  }
  
  // Update spotlight position based on mouse movement
  function updateSpotlightPosition(e) {
    if (spotlightOverlay && isZoomed) {
      // Recreate the spotlight at the new position
      createSpotlightOverlay(e.clientX, e.clientY);
    }
  }
  
  // Apply zoom at specific point with spotlight
  function zoomAtPoint(x, y, zoomFactor = 1.5) {
    console.log('[content.js] zoomAtPoint called:', x, y, zoomFactor);
    
    // If already zoomed, reset first
    if (isZoomed) {
      resetZoom();
    }
    
    // Store original scale and zoom origin
    originalScale = document.documentElement.style.zoom || 1;
    zoomOriginX = x;
    zoomOriginY = y;
    
    // Apply zoom
    document.documentElement.style.transformOrigin = `${x}px ${y}px`;
    document.documentElement.style.transform = `scale(${zoomFactor})`;
    
    // Create spotlight overlay
    createSpotlightOverlay(x, y);
    
    // Update state
    isZoomed = true;
    
    console.log('[content.js] Zoom applied with spotlight');
  }
  
  // Reset zoom to original size
  function resetZoom() {
    console.log('[content.js] resetZoom called');
    
    if (!isZoomed) {
      console.log('[content.js] Not zoomed, nothing to reset');
      return;
    }
    
    // Reset zoom
    document.documentElement.style.transformOrigin = '';
    document.documentElement.style.transform = '';
    
    // Remove spotlight
    removeSpotlightOverlay();
    
    // Update state
    isZoomed = false;
    
    console.log('[content.js] Zoom reset');
  }
  
  function onMouseMove(e) {
    if (!isDrawing) return;
    // console.log('[content.js] onMouseMove - drawing');
    drawArrow(startX, startY, e.clientX, e.clientY);
    // console.log('[content.js] onMouseMove - drawArrow called');
  }
  
  function onMouseUp(e) {
    console.log('[content.js] onMouseUp event:', e);
    if (!isDrawing) return;
    console.log('[content.js] onMouseUp - was drawing');
    // console.log('[content.js] onMouseMove - drawing');
    isDrawing = false;
    console.log('[content.js] isDrawing set to false');
    clearCanvas();
    console.log('[content.js] clearCanvas called after mouseup');
    if (arrowCanvas) {
      arrowCanvas.remove();
      arrowCanvas = null;
      ctx = null;
    }
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }
  
  // Message listener for background script communication
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[content.js] Message received from background:', request);
    
    // Initialize on first message if not already done
    if (!isInitialized) {
      initialize();
    }
    
    // Handle ping messages for checking if content script is ready
    if (request.type === "PING") {
      console.log('[content.js] Received PING, sending PONG');
      sendResponse({status: "PONG"});
      return true;
    }
    
    // Handle mouse action commands
    if (request.type === "MX_MASTER_ACTION") {
      try {
        if (request.command === "start_arrow_draw") {
          console.log('[content.js] Command: start_arrow_draw');
          if (isDrawing) {
            console.log('[content.js] Already drawing, ignoring command.');
            sendResponse({status: "already drawing"});
            return true;
          }
          
          // Get current mouse position
          let lastMouseEvent = window.lastMouseEvent || {clientX: window.innerWidth / 2, clientY: window.innerHeight / 2};
          startX = lastMouseEvent.clientX;
          startY = lastMouseEvent.clientY;
          console.log('[content.js] Start position:', startX, startY);
          
          // Create canvas and start drawing
          if (createCanvas()) {
            isDrawing = true;
            console.log('[content.js] Drawing started');
            window.addEventListener("mousemove", onMouseMove);
            
            // Add our own key listener to ensure the arrow is removed when the key is released
            if (arrowKeyListener) {
              window.removeEventListener('keyup', arrowKeyListener);
            }
            
            arrowKeyListener = function(event) {
              console.log('[content.js] Key released in our listener:', event.key, 'Ctrl:', event.ctrlKey, 'Shift:', event.shiftKey);
              // Check if it's the arrow key combination being released (Ctrl+Shift+L)
              if ((event.key === 'L' || event.key === 'l') && event.ctrlKey && event.shiftKey) {
                console.log('[content.js] Arrow key combination released in our listener');
                // Stop drawing and clean up
                if (isDrawing) {
                  isDrawing = false;
                  console.log('[content.js] Drawing stopped by our key listener');
                  clearCanvas();
                  console.log('[content.js] Canvas cleared by our key listener');
                  if (arrowCanvas) {
                    arrowCanvas.remove();
                    arrowCanvas = null;
                    ctx = null;
                  }
                  window.removeEventListener("mousemove", onMouseMove);
                }
                // Remove this listener
                window.removeEventListener('keyup', arrowKeyListener);
                arrowKeyListener = null;
              }
            };
            
            window.addEventListener('keyup', arrowKeyListener);
            sendResponse({status: "arrow draw started"});
          } else {
            sendResponse({status: "failed to create canvas"});
          }
        } else if (request.command === "stop_arrow_draw") {
          console.log('[content.js] Command: stop_arrow_draw');
          if (!isDrawing) {
            console.log('[content.js] Not drawing, ignoring command.');
            sendResponse({status: "not drawing"});
            return true;
          }
          
          // Stop drawing and clean up
          isDrawing = false;
          console.log('[content.js] Drawing stopped');
          clearCanvas();
          console.log('[content.js] Canvas cleared');
          if (arrowCanvas) {
            arrowCanvas.remove();
            arrowCanvas = null;
            ctx = null;
          }
          window.removeEventListener("mousemove", onMouseMove);
          
          // Remove the key listener if it exists
          if (arrowKeyListener) {
            window.removeEventListener('keyup', arrowKeyListener);
            arrowKeyListener = null;
            console.log('[content.js] Arrow key listener removed');
          }
          
          sendResponse({status: "arrow draw stopped"});
        } else if (request.command === "zoom_in") {
          console.log('[content.js] Command: zoom_in');
          let lastMouseEvent = window.lastMouseEvent || {clientX: window.innerWidth / 2, clientY: window.innerHeight / 2};
          zoomAtPoint(lastMouseEvent.clientX, lastMouseEvent.clientY, 1.5);
          sendResponse({status: "zoom_in executed"});
        } else if (request.command === "zoom_out") {
          console.log('[content.js] Command: zoom_out');
          resetZoom();
          sendResponse({status: "zoom_out executed"});
        } else {
          console.log('[content.js] Unknown command:', request.command);
          sendResponse({status: "unknown command"});
        }
      } catch (error) {
        console.error('[content.js] Error processing command:', error);
        sendResponse({status: "error", message: error.message});
      }
    } else {
      console.log('[content.js] Unknown message type:', request.type);
      sendResponse({status: "unknown message type"});
    }
    return true; // Required for asynchronous sendResponse
  });
  
  // Initialize when the script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Log that the script has finished loading
  console.log('[content.js] Script setup complete');
})();