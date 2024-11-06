# PAWN Painter

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/itsneufox.pawn-painter)](https://marketplace.visualstudio.com/items?itemName=itsneufox.pawn-painter)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

PAWN Painter is a powerful Visual Studio Code extension designed specifically for SA-MP and open.mp development. 
It enhances your coding experience by providing advanced color visualization and editing capabilities for various hex color formats and GameText color codes.

##  Features

###  Color Picker
Integrated color picker supporting multiple hex formats:
- `0xRRGGBB` - Standard hex format
- `0xRRGGBBAA` - Hex format with alpha channel
- `{RRGGBB}` - Curly brace format
- `RRGGBB` - Plain hex format

###  GameText Color Preview
Real-time preview of SA-MP/open.mp GameText colors with brightness levels:
- Basic colors: `~r~`, `~g~`, `~b~`, `~y~`, `~p~`, `~w~`, `~l~`
- Supports multiple brightness levels using `~h~` modifier

###  Color Highlighting
Two distinct highlighting styles for hex colors:
- Underline (default)
- Background highlight

Special handling for colors with `00` alpha value

##  Installation

1. Open Visual Studio Code
2. Go to the Extensions view (Ctrl+Shift+X)
3. Search for "PAWN Painter"
4. Click Install

Alternatively, install directly from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=itsneufox.pawn-painter).

##  Usage

The extension automatically activates for files with these extensions:
- `.pwn`
- `.inc`
- `.p`
- `.pawno`

###  Configuration

Access settings through the extension settings:

| Setting | Description | Default |
|---------|-------------|---------|
| `pawnpainter.enableColorPicker` | Enable/disable color picker for hex formats | `true` |
| `pawnpainter.enableHexColorHighlight` | Enable/disable hex color highlighting | `true` |
| `pawnpainter.hexColorHighlightStyle` | Choose highlighting style ("underline" or "background") | `"underline"` |
| `pawnpainter.enableGameTextColors` | Enable/disable GameText color preview | `true` |
| `pawnpainter.showAlphaZeroHints` | Show hover hints for colors with alpha value of 00 | `true` |

##  Example Code

```pawn
// Hex Color Formats
0xAC2424      // Standard hex
0x861919AA    // Hex with alpha
0x40533700    // Hex with zero alpha
{8D1717}      // Curly braces format
5F0C0C        // Plain hex

// GameText Colors with Brightness Levels
"~r~Basic Red"
"~r~~h~Bright Red"
"~r~~h~~h~Brighter Red"
"~r~~h~~h~~h~Even Brighter"
"~r~~h~~h~~h~~h~Maximum Brightness"

"~g~Green"
"~g~~h~Bright Green"
"~g~~h~~h~Maximum Green"

"~b~Blue Text"
"~b~~h~Light Blue"
"~b~~h~~h~Brightest Blue"

"~y~Yellow"
"~y~~h~Bright Yellow"
"~y~~h~~h~Off White"

"~p~Purple"
"~p~~h~Light Purple"

"~w~White Text"
"~l~Black Text"

// Practical Examples
#define COLOUR_RED 0xFF0000FF
#define COLOUR_GREEN_EMBED "{00FF00}"
SendClientMessage(playerid, -1, "~r~Red ~g~Green ~b~Blue");
SendClientMessage(playerid, 0xFF0000FF, "Coloured message");
```

##  Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

##  Support

If you encounter any issues or have suggestions:
- File an issue on [GitHub](https://github.com/itsneufox/PAWN-Painter/issues)

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Author

Created and maintained by [itsneufox](https://github.com/itsneufox)