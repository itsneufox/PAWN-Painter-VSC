# PAWN Painter

PAWN Painter is a Visual Studio Code extension that enhances PAWN development with integrated color picking and preview features.
It supports standard hexadecimal color formats and SA-MP/open.mp GameText color codes.

## Features

- Supports multiple hex color formats:
  - `0xRRGGBB`
  - `0xRRGGBBAA`
  - `{RRGGBB}`
  - `RRGGBB`

- Supports SA-MP/open.mp GameText colors:
  - Basic colors: `~r~`, `~g~`, `~b~`, `~y~`, `~p~`, `~w~`, `~l~`
  - Brightness levels with `~h~` (e.g., `~r~~h~` for a brighter red)

## Usage

The extension automatically activates for files with the following extensions:
- `.pwn`
- `.inc`
- `.p`
- `.pawno`

## Configuration

You can configure the extension through VS Code extension settings.

- Toggle Normal Colour Picker (pawnpainter.toggleNormalColorPicker): Enabled by default.
- Toggle GameText Colour Picker (pawnpainter.toggleGameTextColorPicker): Disabled by default but can be enabled at will.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Created and maintained by [itsneufox](https://github.com/itsneufox)