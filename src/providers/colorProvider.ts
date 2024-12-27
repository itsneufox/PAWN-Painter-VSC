import * as vscode from 'vscode';
import { ConfigurationLoader } from '../configurations/configLoader';
import { ColorParser } from '../services/colorParser';
import { ColorUtils } from '../utils/colorUtils';
import { FunctionUtils } from '../utils/functionUtils';
import { IgnoredLinesManager } from '../features/ignoredLines/ignoredLinesManager'; // Add this import

export class ColorProvider implements vscode.DocumentColorProvider {
    private configLoader = ConfigurationLoader.getInstance();
    private colorParser = new ColorParser();
    private colorUtils = new ColorUtils();
    private functionUtils = new FunctionUtils();
    private ignoredLinesManager = IgnoredLinesManager.getInstance();

    public provideDocumentColors(
        document: vscode.TextDocument
    ): vscode.ProviderResult<vscode.ColorInformation[]> {
        if (!this.configLoader.getConfig().general.enableColourPicker) {
            return [];
        }

        const colorRanges: vscode.ColorInformation[] = [];
        const text = document.getText();

        // Handle hex colors (0xRRGGBB, 0xRRGGBBAA, {RRGGBB})
        const hexRegex = /(?:0x[0-9A-Fa-f]{6,8}|\{[0-9A-Fa-f]{6}\})/g;
        let match;
        while ((match = hexRegex.exec(text)) !== null) {
            const matchPosition = document.positionAt(match.index);
            
            // Skip if line is ignored
            if (this.ignoredLinesManager.isLineIgnored(document.uri.fsPath, matchPosition.line)) {
                continue;
            }

            const colorCode = match[0];
            const range = new vscode.Range(
                matchPosition,
                document.positionAt(match.index + colorCode.length)
            );
            const parseResult = this.colorParser.parseColor(colorCode);
            if (parseResult) {
                colorRanges.push(new vscode.ColorInformation(range, parseResult.color));
            }
        }

        // Handle RGB/RGBA colors
        const rgbRegex = /(?<![\d.])\b([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9]{1,3}))?\b/g;
        while ((match = rgbRegex.exec(text)) !== null) {
            const [full, r, g, b, a] = match;
            const position = document.positionAt(match.index);

            // Skip if line is ignored
            if (this.ignoredLinesManager.isLineIgnored(document.uri.fsPath, position.line)) {
                continue;
            }

            if (parseInt(r) <= 255 && parseInt(g) <= 255 && parseInt(b) <= 255 && (!a || parseInt(a) <= 255)) {
                const functionName = this.functionUtils.getFunctionNameAtPosition(document, position);
                
                const range = new vscode.Range(
                    position,
                    document.positionAt(match.index + full.length)
                );

                const parseResult = this.colorParser.parseColor(full, {
                    document,
                    position,
                    functionName
                });

                if (parseResult) {
                    colorRanges.push(new vscode.ColorInformation(range, parseResult.color));
                }
            }
        }

        return colorRanges;
    }

    public provideColorPresentations(
        color: vscode.Color,
        context: { document: vscode.TextDocument; range: vscode.Range }
    ): vscode.ProviderResult<vscode.ColorPresentation[]> {
        if (!this.configLoader.getConfig().general.enableColourPicker) {
            return [];
        }

        const originalText = context.document.getText(context.range).trim();
        const presentations: vscode.ColorPresentation[] = [];

        // Handle RGB/RGBA format
        if (originalText.includes(',')) {
            const r = Math.round(color.red * 255);
            const g = Math.round(color.green * 255);
            const b = Math.round(color.blue * 255);
            
            if (originalText.split(',').length > 3) {
                const a = Math.round(color.alpha * 255);
                presentations.push(new vscode.ColorPresentation(`${r}, ${g}, ${b}, ${a}`));
            } else {
                presentations.push(new vscode.ColorPresentation(`${r}, ${g}, ${b}`));
            }
            return presentations;
        }

        // Handle braced hex format
        if (originalText.startsWith('{') && originalText.endsWith('}')) {
            const hexColor = this.colorUtils.colorToHexWithoutAlpha(color).slice(1);
            presentations.push(new vscode.ColorPresentation(`{${hexColor}}`));
            return presentations;
        }

        // Handle 0x hex format
        if (originalText.startsWith('0x')) {
            const hasAlpha = originalText.length === 10;
            if (hasAlpha) {
                const originalAlpha = originalText.slice(-2);
                if (originalAlpha.toLowerCase() === '00') {
                    const baseHex = this.colorUtils.colorToHexWithoutAlpha(color).slice(1);
                    presentations.push(new vscode.ColorPresentation(`0x${baseHex}00`));
                } else {
                    const fullHex = this.colorUtils.colorToHexWithAlpha(color).slice(1);
                    presentations.push(new vscode.ColorPresentation(`0x${fullHex}`));
                }
            } else {
                const baseHex = this.colorUtils.colorToHexWithoutAlpha(color).slice(1);
                presentations.push(new vscode.ColorPresentation(`0x${baseHex}`));
            }
            return presentations;
        }

        // Default to 0x hex format
        const baseHex = this.colorUtils.colorToHexWithoutAlpha(color).slice(1);
        presentations.push(new vscode.ColorPresentation(`0x${baseHex}`));
        return presentations;
    }
}