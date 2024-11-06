# PAWN Painter

PAWN Painter is a Visual Studio Code extension that enhances PAWN development for SA-MP and open.mp with integrated colour picking and preview features.
It provides intuitive colour visualization and editing capabilities for various hex colour formats and GameText colour codes.

## Features

### ?? Colour Picker
- Supports multiple hex colour formats with live preview and editing:
  - `0xRRGGBB` - Standard hex format
  - `0xRRGGBBAA` - Hex format with alpha channel
  - `{RRGGBB}` - Curly brace format
  - `RRGGBB` - Plain hex format

### ?? GameText Colour Preview
- Real-time preview of SA-MP/open.mp GameText colours:
  - Basic colours: `~r~`, `~g~`, `~b~`, `~y~`, `~p~`, `~w~`, `~l~`
  - Multiple brightness levels using `~h~` (e.g., `~r~~h~` for brighter red)

### ??? Colour Highlighting
- Two highlighting styles for hex colours:
  - Underline (default)
  - Background highlight

- Alpha channel handling for colours with `00` alpha value

## Installation


You can install it directly from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=itsneufox.pawn-painter).

Or search "Pawn Painter" on the Extensions tab inside Visual Studio Code.

## Usage

The extension automatically activates for files with these extensions:
- `.pwn`
- `.inc`
- `.p`
- `.pawno`

### Configuration

Configure the extension in VS Code settings:

- `Enable Colour Picker`: Enable/disable the colour picker for hex formats
- `Enable Hex Colour Highlight`: Enable/disable hex colour highlighting
- `Hex Colour Highlight Style`: Choose between "underline" or "background" highlighting
- `Enable GameText Colours`: Enable/disable GameText colour preview

## Example Code

```pawn
// Hex Colour Formats
0xAC2424      // Standard hex
0x861919AA    // Hex with alpha
0x40533700    // Hex with zero alpha
{8D1717}      // Curly braces format
5F0C0C        // Plain hex

// GameText Colours with Brightness Levels
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

## Support

If you encounter any issues or have suggestions:
- File an issue on [GitHub](https://github.com/itsneufox/PAWN-Painter/issues)

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Created and maintained by [itsneufox](https://github.com/itsneufox)