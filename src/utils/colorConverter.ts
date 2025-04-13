export class ColorConverter {
    public decimalToHexColor(decimal: number): string {
        if (decimal === -1) {
            return '0xFFFFFFFF';
        }

        let normalizedValue = decimal;
        if (decimal < 0) {
            normalizedValue = 0xffffffff + decimal + 1;
        }

        let hexString = normalizedValue.toString(16).toUpperCase();

        if (hexString.length <= 6) {
            hexString = hexString.padStart(6, '0');
            hexString += 'FF';
        } else {
            hexString = hexString.padStart(8, '0');
        }

        return `0x${hexString}`;
    }

    /**
     * Converts a hex color to decimal format for SAMP/open.mp
     *
     * @param hexColor The hex color string (e.g., "0xBABA40FF", "0xBABA40", or "{BABA40}")
     * @returns Decimal color value
     */
    public hexToDecimalColor(hexColor: string): number {
        let cleanHex = hexColor.replace(/^0x|\{|\}/g, '').toUpperCase();

        if (cleanHex.length === 6) {
            cleanHex += 'FF';
        }

        cleanHex = cleanHex.padStart(8, '0');

        return parseInt(cleanHex, 16);
    }

    public formatColor(colorValue: number | string, format: string): string {
        let hexColor: string;

        if (typeof colorValue === 'number') {
            hexColor = this.decimalToHexColor(colorValue);
        } else if (typeof colorValue === 'string') {
            if (colorValue.match(/^(0x|\{)[0-9A-Fa-f]+/)) {
                hexColor = this.decimalToHexColor(this.hexToDecimalColor(colorValue));
            } else if (colorValue.match(/^-?\d+$/)) {
                hexColor = this.decimalToHexColor(parseInt(colorValue, 10));
            } else {
                return colorValue;
            }
        } else {
            return String(colorValue);
        }

        const colorStr = hexColor.replace('0x', '');

        switch (format) {
            case '0xRRGGBBAA':
                return `0x${colorStr}`;

            case '0xRRGGBB':
                return `0x${colorStr.substring(0, 6)}`;

            case '{RRGGBB}':
                return `{${colorStr.substring(0, 6)}}`;

            case 'DECIMAL':
                return this.hexToDecimalColor(hexColor).toString();

            default:
                return hexColor;
        }
    }

    public detectColorFormat(colorStr: string): string | null {
        const normalizedStr = colorStr.trim();

        if (/^0x[0-9A-Fa-f]{8}$/i.test(normalizedStr)) {
            return '0xRRGGBBAA';
        } else if (/^0x[0-9A-Fa-f]{6}$/i.test(normalizedStr)) {
            return '0xRRGGBB';
        } else if (/^\{[0-9A-Fa-f]{6}\}$/i.test(normalizedStr)) {
            return '{RRGGBB}';
        } else if (/^-?\d+$/.test(normalizedStr)) {
            return 'DECIMAL';
        }

        return null;
    }
}
