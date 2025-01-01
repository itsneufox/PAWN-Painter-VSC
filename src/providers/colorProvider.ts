import * as vscode from 'vscode';
import { IgnoredLinesManager } from '../features/ignoredLines/ignoredLinesManager';
import { FunctionUtils } from '../utils/functionUtils';

export class ColorProvider implements vscode.DocumentColorProvider {
    private functionUtils = new FunctionUtils();

    public provideDocumentColors(
        document: vscode.TextDocument
    ): vscode.ProviderResult<vscode.ColorInformation[]> {
        const colorRanges: vscode.ColorInformation[] = [];
        const text = document.getText();
        const manager = IgnoredLinesManager.getInstance();

        // Match hex colors (0xRRGGBB and 0xRRGGBBAA)
        const hexRegex = /\b0x([0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?)\b/g;
        let match;

        while ((match = hexRegex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const position = startPos;

            // Skip if line is ignored
            if (manager && manager.isLineIgnored(document.uri.fsPath, startPos.line)) {
                continue;
            }

            // Check if we're in a TextDraw function
            const functionName = this.functionUtils.getFunctionNameAtPosition(document, position);
            if (functionName?.match(/(?:Player)?TextDraw(?:Colour|Color)/)) {
                continue; // Skip color picker for TextDraw functions
            }

            const hex = match[1];
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;
            const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;

            const range = new vscode.Range(
                startPos,
                document.positionAt(match.index + match[0].length)
            );

            colorRanges.push(new vscode.ColorInformation(
                range,
                new vscode.Color(r, g, b, a)
            ));
        }

        // Match braced colors ({RRGGBB})
        const bracedRegex = /\{([0-9A-Fa-f]{6})\}/g;
        while ((match = bracedRegex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);

            // Skip if line is ignored
            if (manager && manager.isLineIgnored(document.uri.fsPath, startPos.line)) {
                continue;
            }

            const hex = match[1];
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;

            const range = new vscode.Range(
                startPos,
                document.positionAt(match.index + match[0].length)
            );

            colorRanges.push(new vscode.ColorInformation(
                range,
                new vscode.Color(r, g, b, 1)
            ));
        }

        // Match RGB/RGBA values
        const rgbRegex = /(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d{1,3}))?/g;
        while ((match = rgbRegex.exec(text)) !== null) {
            const startPos = document.positionAt(match.index);
            const position = startPos;

            // Skip if line is ignored
            if (manager && manager.isLineIgnored(document.uri.fsPath, startPos.line)) {
                continue;
            }

            // Process RGB values in TextDraw functions
            const functionName = this.functionUtils.getFunctionNameAtPosition(document, position);
            if (functionName?.match(/(?:Player)?TextDraw(?:Colour|Color)/)) {
                const [_, r, g, b, a] = match;
                if (parseInt(r) <= 255 && parseInt(g) <= 255 && parseInt(b) <= 255) {
                    const range = new vscode.Range(
                        startPos,
                        document.positionAt(match.index + match[0].length)
                    );

                    colorRanges.push(new vscode.ColorInformation(
                        range,
                        new vscode.Color(
                            parseInt(r) / 255,
                            parseInt(g) / 255,
                            parseInt(b) / 255,
                            a ? parseInt(a) / 255 : 1
                        )
                    ));
                }
            }
        }

        return colorRanges;
    }

    public provideColorPresentations(
        color: vscode.Color,
        context: { document: vscode.TextDocument; range: vscode.Range }
    ): vscode.ProviderResult<vscode.ColorPresentation[]> {
        const manager = IgnoredLinesManager.getInstance();
        
        // Skip if line is ignored
        if (manager && manager.isLineIgnored(
            context.document.uri.fsPath,
            context.range.start.line
        )) {
            return [];
        }

        const originalText = context.document.getText(context.range).trim();

        // Check if we're in a TextDraw function
        const functionName = this.functionUtils.getFunctionNameAtPosition(
            context.document,
            context.range.start
        );

        if (functionName?.match(/(?:Player)?TextDraw(?:Colour|Color)/)) {
            // For TextDraw functions, return RGB format
            const r = Math.round(color.red * 255);
            const g = Math.round(color.green * 255);
            const b = Math.round(color.blue * 255);
            return [new vscode.ColorPresentation(`${r}, ${g}, ${b}`)];
        }

        // For other contexts, handle hex formats
        const r = Math.round(color.red * 255);
        const g = Math.round(color.green * 255);
        const b = Math.round(color.blue * 255);
        const hex = [r, g, b]
            .map(n => n.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();

        if (originalText.startsWith('{')) {
            return [new vscode.ColorPresentation(`{${hex}}`)];
        }

        // Check if original had alpha
        if (originalText.length === 10) { // 0xRRGGBBAA format
            const a = Math.round(color.alpha * 255);
            const hexWithAlpha = hex + a.toString(16).padStart(2, '0').toUpperCase();
            return [new vscode.ColorPresentation(`0x${hexWithAlpha}`)];
        }

        // Default to 0xRRGGBB format
        return [new vscode.ColorPresentation(`0x${hex}`)];
    }
}