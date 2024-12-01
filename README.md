# PAWN Painter - Visual Studio Code Version

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/itsneufox.pawn-painter)](https://marketplace.visualstudio.com/items?itemName=itsneufox.pawn-painter)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

PAWN Painter is a powerful Visual Studio Code extension designed specifically for SA-MP and open.mp development. 
It enhances your coding experience by providing advanced color visualization and editing capabilities for various hex color formats and GameText color codes.

##  Features

### Color Visualization
Support for multiple color formats:
- Hex format: `0xRRGGBB` and `0xRRGGBBAA`
- Braced format: `{RRGGBB}`
- RGB format: `r, g, b`
- RGBA format: `r, g, b, a`

### GameText Color Preview
Real-time preview of SA-MP/open.mp GameText colors with brightness levels:
- Basic colors: `~r~`, `~g~`, `~b~`, `~y~`, `~p~`, `~w~`, `~s~`, `~l~`
- Multiple brightness levels using `~h~` modifier
- Three styling options: text color, underline, or background highlight

### Flexible Styling Options
Three distinct styling options for all color formats:
- Text color (changes the actual text color)
- Underline (colored line under the text)
- Background (colored background behind the text)

### Special Features
- Alpha channel support with warnings for `00` alpha values
- Color picker integration for all supported formats
- Inline color text highlighting

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
| `pawnpainter.general.enableColorPicker` | Enable/disable color picker functionality | `true` |
| `pawnpainter.hex.enabled` | Enable/disable hex color highlighting | `true` |
| `pawnpainter.hex.style` | Highlighting style ("text", "underline", or "background") | `"underline"` |
| `pawnpainter.hex.showAlphaWarnings` | Show warnings for colors with alpha value of 00 | `true` |
| `pawnpainter.gameText.enabled` | Enable/disable GameText color preview | `true` |
| `pawnpainter.gameText.style` | GameText style ("text", "underline", or "background") | `"text"` |
| `pawnpainter.inlineText.enabled` | Enable/disable inline color highlighting | `true` |
| `pawnpainter.inlineText.style` | Inline text style ("text", "underline", or "background") | `"text"` |

##  Example Code

```pawn
"~r~Macaco saw a red light."
"~r~~h~Macaco ignored it!"
"~r~~h~~h~Macaco hit a pole."
"~r~~h~~h~~h~Macaco blamed the banana."
"~r~~h~~h~~h~~h~Everyone else blamed Macaco."

"~g~Macaco found a green banana."
"~g~~h~Macaco waited."
"~g~~h~~h~Still green."

"~b~Macaco stole a bike."
"~b~~h~It was blue and he lost it."
"~b~~h~~h~it was in the ocean!"

"~y~Macaco bought a banana."
"~y~~h~It was bright yellow."
"~y~~h~~h~Off-white by noon"
"~l~Gone by evening..."

"~p~Macaco joined a purple gang."
"~p~~h~They gave him a light purple bike."
"~w~White flag? Never!"

#define STANDARD_HEX            0xD49D04FF
#define HEX_WITH_ALPHA          0xFF00FFFF
#define HEX_WITH_ZERO_ALPHA     0x00F2FA00
#define CURLY_BRACES            "{0066FF}"
#define PLAIN_HEX               0x00F351

SendClientMessage(playerid, STANDARD_HEX, "~r~~h~Macaco ~g~~h~~h~tried to hide, but ~p~~h~no one can escape the spotlight.");

SendClientMessage(playerid, 0xFF0000FF, "Macaco tried to rob a bank... only stole bananas. Still got 5 stars!");

SendClientMessage(playerid, STANDARD_HEX, "{E62929}Macaco {FFFFFF}spawned, stole a {E6A829}bike{FFFFFF}, crashed into a {55E961}banana stand{FFFFFF}.");
SendClientMessage(playerid, STANDARD_HEX, "{E62929}Macaco {FFFFFF}is now {E6A829}wanted{FFFFFF} for {E62929}armed peeling{FFFFFF}. It's bananas!!!");
```

##  Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

##  Support

If you encounter any issues or have suggestions:
- File an issue on [GitHub](https://github.com/itsneufox/PAWN-Painter/issues)

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Special Thanks

ToiletDuck from [equitygaming.net](equitygaming.net)

##  Author

Created and maintained by [itsneufox](https://github.com/itsneufox)
