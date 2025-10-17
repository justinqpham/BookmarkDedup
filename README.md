# Bookmark Duplicate Cleaner

A clean, professional Chrome extension that automatically detects and removes duplicate bookmarks and folders from your browser.

## Features

- 🔍 **Smart Duplicate Detection**: Scans all bookmarks by exact URL match (not just domain level)
- 📁 **Folder Deduplication**: Detects and removes duplicate folders by name
- 🆕 **Keeps Newest**: Automatically keeps the most recently added bookmark/folder
- 👀 **Preview Before Delete**: Shows exactly what will be deleted before taking action
- ✅ **Confirmation Required**: Requires explicit confirmation before deleting anything
- 🎨 **Apple-Inspired Design**: Clean, professional UI with native macOS styling

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right corner)
4. Click "Load unpacked"
5. Select the extension folder

## Usage

1. Click the extension icon in your Chrome toolbar
2. Click "Scan for Duplicates"
3. Review the preview showing:
   - ✓ Which bookmarks/folders will be **kept** (newest ones)
   - ✗ Which bookmarks/folders will be **deleted** (older duplicates)
4. Click "Delete Selected Duplicates" to confirm, or "Cancel" to abort

## How It Works

### Bookmark Matching
Bookmarks are matched by their **exact full URL**, including:
- Protocol (http/https)
- Domain
- Path
- Query parameters
- Fragment identifiers

**Example:**
- `https://example.com/page1` ≠ `https://example.com/page2` (kept - different pages)
- `https://example.com/page1` = `https://example.com/page1` (deduplicated - exact match)

### Folder Matching
Folders are matched by their **exact name**:
- Duplicate folders with the same name are identified
- The newest folder is kept
- Older folders and all their contents are marked for deletion

### Duplicate Resolution
When duplicates are found:
- Items are sorted by creation date (`dateAdded`)
- The **newest** item is kept
- All older duplicates are marked for deletion

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Core logic for scanning and deleting duplicates
- `popup.css` - Apple-inspired styling
- `icon.svg` - Source icon file
- `icon16.png`, `icon48.png`, `icon128.png` - Extension icons

## Technical Details

### Permissions
The extension requires the `bookmarks` permission to:
- Read your bookmark tree structure
- Delete duplicate bookmarks and folders

### Privacy
- All processing happens locally in your browser
- No data is sent to external servers
- No analytics or tracking

### Browser Compatibility
- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Development

### Prerequisites
- Chrome browser
- Basic knowledge of Chrome Extension development

### Building
No build process required. The extension uses vanilla JavaScript.

### Modifying Icons
If you want to customize the icon:
1. Edit `icon.svg`
2. Convert to PNG using ImageMagick:
```bash
magick icon.svg -resize 128x128 icon128.png
magick icon.svg -resize 48x48 icon48.png
magick icon.svg -resize 16x16 icon16.png
```

## License

MIT License - feel free to use and modify as needed.

---
*Last updated: $(date)*
