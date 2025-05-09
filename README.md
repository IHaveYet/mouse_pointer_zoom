# Mouse Pointer Zoom

A Chrome extension that enhances instructional videos and screen recordings with two powerful features:

1. **Spotlight Effect**: Creates a clear, rounded rectangle spotlight around the cursor with blur effect outside
2. **Arrow Drawing**: Allows drawing large, prominent red arrows to point at specific elements

Both features are activated via keyboard shortcuts and only appear while the key combinations are held down.

## Features

### Spotlight Effect (Ctrl+Shift+Z)
- Creates a clear rounded rectangle around the cursor
- Blurs everything outside the spotlight
- Displays a thick, animated border with color-chasing effect
- Follows cursor movement in real-time

### Arrow Drawing (Ctrl+Shift+L)
- Draws a large red arrow from the initial cursor position
- Features a thick 12px shaft and large 45px arrowhead
- High visibility with clean edges
- Follows cursor movement in real-time

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the repository folder
5. The extension is now installed and ready to use

## Usage

- Press and hold **Ctrl+Shift+Z** to activate the spotlight effect
- Press and hold **Ctrl+Shift+L** to draw an arrow
- Release the keys to deactivate the features

## Project Structure

- `manifest.json`: Extension configuration
- `background.js`: Background script for handling commands
- `content.js`: Content script for visual effects
- `prompt.md`: Detailed documentation and implementation guide

## License

MIT