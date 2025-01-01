# PAWN Painter - Visual Studio Code Extension

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/itsneufox.pawn-painter)](https://marketplace.visualstudio.com/items?itemName=itsneufox.pawn-painter)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

PAWN Painter is a powerful Visual Studio Code extension designed specifically for SA-MP and open.mp development. 
It enhances your coding experience by providing advanced color visualization and editing capabilities for various color formats.

## Features

### Color Visualization
- **Multiple Color Formats Support**:
  - Hex format: `0xRRGGBB` and `0xRRGGBBAA`
  - Braced format: `{RRGGBB}`
  - RGB format: `r, g, b`
  - RGBA format: `r, g, b, a`

### GameText Color Preview
- **Real-time Preview** of SA-MP/open.mp GameText colors with brightness levels
  - Basic colors: `~r~`, `~g~`, `~b~`, `~y~`, `~p~`, `~w~`, `~s~`, `~l~`
  - Multiple brightness levels using `~h~` modifier
  - Three styling options: text color, underline, or background highlight

### Advanced Color Management
- **Selective Color Highlighting**:
  - Ignore specific lines from color highlighting
  - Multi-line color ignore support
  - History view with line preview
  - Easy restoration of ignored colors
- **Flexible Styling Options**:
  - Text color (changes the actual text color)
  - Underline (colored line under the text)
  - Background (colored background behind the text)

### Developer Tools
- **Smart Color Detection**:
  - Context-aware color parsing
  - Enhanced TextDraw function support
  - Optimized performance for large files
- **Alpha Channel Support**:
  - Full support for RGBA colors
  - Warnings for `00` alpha values
  - Bitwise operation compatibility

### Color Picker Integration
- **VS Code Native Color Picker** support for all formats
- **Inline Color Text Highlighting**

## Installation

1. Open Visual Studio Code
2. Go to the Extensions view (Ctrl+Shift+X)
3. Search for "PAWN Painter"
4. Click Install

Alternatively, install directly from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=itsneufox.pawn-painter).

## Configuration

Access settings through VS Code's settings or directly in your `settings.json`:

| Setting | Description | Default |
|---------|-------------|---------|
| `pawnpainter.general.enableColorPicker` | Enable/disable color picker functionality | `true` |
| `pawnpainter.hex.enabled` | Enable/disable hex color highlighting | `true` |
| `pawnpainter.hex.style` | Highlighting style ("text", "underline", or "background") | `"underline"` |
| `pawnpainter.hex.showAlphaWarnings` | Show warnings for colors with alpha value of 00 | `true` |
| `pawnpainter.gameText.enabled` | Enable/disable GameText color preview | `true` |
| `pawnpainter.gameText.style` | GameText style ("text", "underline", or "background") | `"text"` |
| `pawnpainter.inlineText.enabled` | Enable/disable inline color highlighting | `true` |
| `pawnpainter.inlineText.codeStyle` | Style for color code itself ("text", "underline", or "background") | `"underline"` |
| `pawnpainter.inlineText.textStyle` | Style for text following color code ("text", "underline", or "background") | `"text"` |

## Available Commands

- `Toggle Hex Color Highlighting`: Enable/disable hex color visualization
- `Toggle Inline Colors`: Enable/disable inline color highlighting
- `Toggle GameText Color Preview`: Enable/disable GameText color visualization
- `Toggle Normal Color Picker`: Enable/disable VS Code's native color picker
- `Ignore Color On Selected Line(s)`: Ignore color highlighting for selected lines
- `Restore Color To Selected Line(s)`: Restore color highlighting to ignored lines
- `Clear All Ignored Lines`: Remove all ignored line settings
- `History Of All Ignored Lines`: View and manage ignored lines

## Example Code

```pawn
// GameText Color Examples
"~r~Red text"
"~r~~h~Lighter red"
"~r~~h~~h~Even lighter red"
"~g~Green text"
"~b~Blue text"
"~y~Yellow text"
"~p~Purple text"
"~w~White text"
"~l~Black text"

// Hex Color Examples
#define COLOR_RED       0xFF0000FF
#define COLOR_GREEN     0x00FF00FF
#define COLOR_BLUE      0x0000FFFF
#define COLOR_ALPHA     0xFF00FF80  // With alpha

// Inline Color Examples
SendClientMessage(playerid, -1, "{FF0000}Red text {00FF00}Green text {0000FF}Blue text");

// RGB Format (TextDraw)
TextDrawColor(text, 255, 0, 0);    // Red
TextDrawColor(text, 0, 255, 0);    // Green
TextDrawColor(text, 0, 0, 255);    // Blue
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have suggestions:
- File an issue on [GitHub](https://github.com/itsneufox/PAWN-Painter-VSC/issues)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Created and maintained by [itsneufox](https://github.com/itsneufox)