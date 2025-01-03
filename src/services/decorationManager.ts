import * as vscode from 'vscode';
import { DecorationManager } from '../models/decorations';
import { DecorationStyle } from '../configurations/config';
import { ViewportManager } from '../models/viewport';
import { ConfigurationLoader } from '../configurations/configLoader';
import { ColorParser } from './colorParser';
import { ColorUtils } from '../utils/colorUtils';
import { FunctionUtils } from '../utils/functionUtils';
import { REGEX_PATTERNS } from '../constants';
import { IgnoredLinesManager } from '../features/ignoredLines/ignoredLinesManager';

export class DecorationManagerService {
    private decorationManager = DecorationManager.getInstance();
    private configLoader = ConfigurationLoader.getInstance();
    private colorParser = new ColorParser();
    private colorUtils = new ColorUtils();
    private functionUtils = new FunctionUtils();

    public updateGameTextDecorations(editor: vscode.TextEditor): void {
        const config = this.configLoader.getConfig();
        if (!config.gameText.enabled || !editor) {
            this.clearGameTextDecorations(editor);
            return;
        }

        const viewport = ViewportManager.getVisibleRangeWithBuffer(editor);
        const viewportText = ViewportManager.getViewportText(editor, viewport);
        const absoluteStart = ViewportManager.getAbsoluteOffset(editor, viewport);

        this.decorationManager.disposeGameTextDecorations();
        const decorationsMap: { [key: string]: vscode.DecorationOptions[] } = {};

        const quotedMatches = viewportText.matchAll(REGEX_PATTERNS.QUOTED_TEXT);
        for (const quotedMatch of quotedMatches) {
            const quotedContent = quotedMatch[0];
            const quotedStart = quotedMatch.index!;
            
            const segments = this.processGameTextSegments(quotedContent);
            const absoluteQuoteStart = absoluteStart + quotedStart;

            this.applyGameTextDecorations(
                editor,
                segments,
                absoluteQuoteStart,
                viewport,
                decorationsMap,
                config.gameText.style
            );
        }

        Object.entries(decorationsMap).forEach(([decorationKey, decorations]) => {
            const decorationType = this.decorationManager.getGameTextDecoration(decorationKey);
            if (decorationType) {
                editor.setDecorations(decorationType, decorations);
            }
        });
    }

    public updateHexColorDecorations(editor: vscode.TextEditor): void {
        const config = this.configLoader.getConfig();
        if (!config.hex.enabled || !editor) {
            this.clearHexColorDecorations(editor);
            return;
        }

        const viewport = ViewportManager.getVisibleRangeWithBuffer(editor);
        const viewportText = ViewportManager.getViewportText(editor, viewport);
        const absoluteStart = ViewportManager.getAbsoluteOffset(editor, viewport);

        this.decorationManager.disposeHexColorDecorations();
        const decorationsMap = new Map<string, vscode.DecorationOptions[]>();

        // Process hex colors (0xRRGGBB, 0xRRGGBBAA, {RRGGBB})
        const hexMatches = viewportText.matchAll(REGEX_PATTERNS.HEX_COLOR);
        for (const hexMatch of hexMatches) {
            const colorCode = hexMatch[0];
            const position = editor.document.positionAt(absoluteStart + hexMatch.index!);
            const functionName = this.functionUtils.getFunctionNameAtPosition(editor.document, position);

            const range = new vscode.Range(
                position,
                editor.document.positionAt(absoluteStart + hexMatch.index! + colorCode.length)
            );

            const manager = IgnoredLinesManager.getInstance();
            if (manager.isLineIgnored(editor.document.uri.fsPath, range.start.line)) {
                continue;
            }

            if (ViewportManager.isWithinViewport(range, viewport)) {
                this.processAndApplyHexColor(
                    colorCode,
                    range,
                    editor,
                    position,
                    functionName,
                    decorationsMap,
                    config.hex.style
                );
            }
        }

        // Process RGB/RGBA colors
        const rgbMatches = viewportText.matchAll(REGEX_PATTERNS.RGB_COLOR);
        for (const rgbMatch of rgbMatches) {
            const [full, r, g, b, a] = rgbMatch;
            if (this.colorUtils.isValidRGB(parseInt(r), parseInt(g), parseInt(b)) &&
                (!a || this.colorUtils.isValidAlpha(parseInt(a)))) {
                const position = editor.document.positionAt(absoluteStart + rgbMatch.index!);
                const functionName = this.functionUtils.getFunctionNameAtPosition(editor.document, position);
                
                const range = new vscode.Range(
                    position,
                    editor.document.positionAt(absoluteStart + rgbMatch.index! + full.length)
                );

                const manager = IgnoredLinesManager.getInstance();
                if (manager.isLineIgnored(editor.document.uri.fsPath, range.start.line)) {
                    continue;
                }

                if (ViewportManager.isWithinViewport(range, viewport)) {
                    this.processAndApplyRGBColor(
                        full,
                        range,
                        editor,
                        position,
                        functionName,
                        decorationsMap,
                        config.hex.style
                    );
                }
            }
        }

        decorationsMap.forEach((decorations, colorKey) => {
            const decorationType = this.decorationManager.getHexColorDecoration(colorKey);
            if (decorationType) {
                editor.setDecorations(decorationType, decorations);
            }
        });
    }

    public updateInlineColorDecorations(editor: vscode.TextEditor): void {
        const config = this.configLoader.getConfig();
        if (!config.inlineText.enabled || !editor) {
            this.clearInlineColorDecorations(editor);
            return;
        }

        const viewport = ViewportManager.getVisibleRangeWithBuffer(editor);
        const viewportText = ViewportManager.getViewportText(editor, viewport);
        const absoluteStart = ViewportManager.getAbsoluteOffset(editor, viewport);

        this.decorationManager.disposeInlineColorDecorations();
        const decorationsMap = new Map<string, vscode.DecorationOptions[]>();

        // Process only content inside quotes
        const quotedTextRegex = /"[^"]*"/g;
        let quotedMatch;

        while ((quotedMatch = quotedTextRegex.exec(viewportText)) !== null) {
            const quotedContent = quotedMatch[0];
            const quotedStart = quotedMatch.index!;
            
            const colourTagRegex = /\{([0-9A-Fa-f]{6})\}/g;
            let colorMatch;

            while ((colorMatch = colourTagRegex.exec(quotedContent)) !== null) {
                const colorStart = absoluteStart + quotedStart + colorMatch.index;
                const range = new vscode.Range(
                    editor.document.positionAt(colorStart),
                    editor.document.positionAt(colorStart + colorMatch[0].length)
                );

                const manager = IgnoredLinesManager.getInstance();
                if (manager.isLineIgnored(editor.document.uri.fsPath, range.start.line)) {
                    continue;
                }

                if (ViewportManager.isWithinViewport(range, viewport)) {
                    this.processAndApplyInlineColor(
                        colorMatch[1],
                        range,
                        editor.document,
                        decorationsMap,
                        config.inlineText.codeStyle,
                        config.inlineText.textStyle
                    );
                }
            }
        }

        decorationsMap.forEach((decorations, colorKey) => {
            const decorationType = this.decorationManager.getInlineColorDecoration(colorKey);
            if (decorationType) {
                editor.setDecorations(decorationType, decorations);
            }
        });
    }

    private processGameTextSegments(text: string) {
        const segments = [];
        const gameTextRegex = REGEX_PATTERNS.GAME_TEXT_COLOR;
        let lastMatchEnd = 0;
        let match;

        const startOffset = text.startsWith('"') ? 1 : 0;
        const endOffset = text.endsWith('"') ? text.length - 1 : text.length;

        while ((match = gameTextRegex.exec(text)) !== null) {
            const matchIndex = match.index;
            
            // Only process if we're between quotes
            if (matchIndex >= startOffset && matchIndex < endOffset) {
                if (matchIndex > lastMatchEnd) {
                    segments.push({
                        text: text.slice(lastMatchEnd, matchIndex),
                        startIndex: lastMatchEnd,
                        colorChar: null,
                        lightLevels: 0
                    });
                }

                const colorChar = match[1];
                const lightLevels = (match[0].match(/~h~/g) || []).length;
                const matchEnd = matchIndex + match[0].length;

                const nextMatch = gameTextRegex.exec(text);
                gameTextRegex.lastIndex = matchEnd;

                const textEndIndex = nextMatch ? nextMatch.index : endOffset;

                segments.push({
                    text: text.slice(matchEnd, textEndIndex),
                    startIndex: matchEnd,
                    colorChar,
                    lightLevels
                });

                lastMatchEnd = textEndIndex;

                if (nextMatch) {
                    gameTextRegex.lastIndex = nextMatch.index;
                }
            }
        }

        return segments;
    }

    private applyGameTextDecorations(
        editor: vscode.TextEditor,
        segments: any[],
        absoluteStart: number,
        viewport: any,
        decorationsMap: { [key: string]: vscode.DecorationOptions[] },
        style: string
    ) {
        segments.forEach(segment => {
            if (segment.colorChar && segment.text.length > 0) {
                const color = this.colorParser.parseGameTextColor(segment.colorChar, segment.lightLevels);
                if (!color) return;

                const range = ViewportManager.createRange(
                    editor,
                    absoluteStart + segment.startIndex,
                    segment.text.length
                );

                const manager = IgnoredLinesManager.getInstance();
                if (manager.isLineIgnored(editor.document.uri.fsPath, range.start.line)) {
                    return;
                }

                if (ViewportManager.isWithinViewport(range, viewport)) {
                    const decorationKey = `${segment.colorChar}_${segment.lightLevels}`;
                    
                    if (!decorationsMap[decorationKey]) {
                        decorationsMap[decorationKey] = [];
                        
                        if (!this.decorationManager.getGameTextDecoration(decorationKey)) {
                            const decoration = vscode.window.createTextEditorDecorationType(
                                this.decorationManager.createDecorationFromStyle(color, style as DecorationStyle)
                            );
                            this.decorationManager.setGameTextDecoration(decorationKey, decoration);
                        }
                    }
                    
                    decorationsMap[decorationKey].push({ range });
                }
            }
        });
    }

    private processAndApplyHexColor(
        colorCode: string,
        range: vscode.Range,
        editor: vscode.TextEditor,
        position: vscode.Position,
        functionName: string | undefined,
        decorationsMap: Map<string, vscode.DecorationOptions[]>,
        style: string
    ) {
        const parseResult = this.colorParser.parseColor(colorCode, {
            document: editor.document,
            position,
            functionName
        });

        if (parseResult) {
            const color = parseResult.color;
            const colorKey = this.colorUtils.colorToHexWithAlpha(color);

            if (!decorationsMap.has(colorKey)) {
                decorationsMap.set(colorKey, []);
                const decorationType = vscode.window.createTextEditorDecorationType(
                    this.decorationManager.createDecorationFromStyle(color, style as DecorationStyle)
                );
                this.decorationManager.setHexColorDecoration(colorKey, decorationType);
            }

            const decorationOptions: vscode.DecorationOptions = {
                range,
                hoverMessage: this.configLoader.getConfig().hex.showAlphaWarnings && 
                             parseResult.hasZeroAlpha ? 
                             new vscode.MarkdownString("This colour has alpha value of 00.\n" +
                                                     "If it's intentional or you use bitwise operations,\n" +
                                                     "consider disregarding this message!") : 
                             undefined
            };

            decorationsMap.get(colorKey)!.push(decorationOptions);
        }
    }

    private processAndApplyRGBColor(
        colorStr: string,
        range: vscode.Range,
        editor: vscode.TextEditor,
        position: vscode.Position,
        functionName: string | undefined,
        decorationsMap: Map<string, vscode.DecorationOptions[]>,
        style: string
    ) {
        const parseResult = this.colorParser.parseColor(colorStr, {
            document: editor.document,
            position,
            functionName
        });

        if (parseResult) {
            const color = parseResult.color;
            const colorKey = this.colorUtils.colorToHexWithAlpha(color);

            if (!decorationsMap.has(colorKey)) {
                decorationsMap.set(colorKey, []);
                const decorationType = vscode.window.createTextEditorDecorationType(
                    this.decorationManager.createDecorationFromStyle(color, style as DecorationStyle)
                );
                this.decorationManager.setHexColorDecoration(colorKey, decorationType);
            }

            decorationsMap.get(colorKey)!.push({ range });
        }
    }

    private processAndApplyInlineColor(
        colorCode: string,
        range: vscode.Range,
        editor: vscode.TextDocument,
        decorationsMap: Map<string, vscode.DecorationOptions[]>,
        codeStyle: DecorationStyle,
        textStyle: DecorationStyle
    ) {
        const parseResult = this.colorParser.parseColor(`{${colorCode}}`);
        if (!parseResult) return;

        const color = parseResult.color;
        const colorKey = this.colorUtils.colorToHexWithAlpha(color);

        // Apply style to the color code
        const codeKey = `${colorKey}_code`;
        if (!decorationsMap.has(codeKey)) {
            decorationsMap.set(codeKey, []);
            const decorationType = vscode.window.createTextEditorDecorationType(
                this.decorationManager.createDecorationFromStyle(color, codeStyle)
            );
            this.decorationManager.setInlineColorDecoration(codeKey, decorationType);
        }
        decorationsMap.get(codeKey)!.push({ range });

        // Find the text after the color code until next color code or quote
        const lineText = editor.lineAt(range.end.line).text;
        const startPos = range.end.character;
        let endPos = lineText.length;

        // Look for next color code or closing quote
        const nextColorIndex = lineText.indexOf('{', startPos);
        const nextQuoteIndex = lineText.indexOf('"', startPos);

        if (nextColorIndex !== -1) {
            endPos = nextColorIndex;
        }
        if (nextQuoteIndex !== -1 && nextQuoteIndex < endPos) {
            endPos = nextQuoteIndex;
        }

        // Create range for the text
        const textRange = new vscode.Range(
            range.end,
            new vscode.Position(range.end.line, endPos)
        );

        // Apply style to the text if it's not empty
        if (endPos > startPos) {
            const textKey = `${colorKey}_text`;
            if (!decorationsMap.has(textKey)) {
                decorationsMap.set(textKey, []);
                const decorationType = vscode.window.createTextEditorDecorationType(
                    this.decorationManager.createDecorationFromStyle(color, textStyle)
                );
                this.decorationManager.setInlineColorDecoration(textKey, decorationType);
            }
            decorationsMap.get(textKey)!.push({ range: textRange });
        }
    }

    private clearGameTextDecorations(editor: vscode.TextEditor): void {
        Object.values(this.decorationManager.getAllGameTextDecorations()).forEach(decoration => {
            editor.setDecorations(decoration, []);
        });
    }

    private clearHexColorDecorations(editor: vscode.TextEditor): void {
        Array.from(this.decorationManager.getHexColorDecorations().values()).forEach(decoration => {
            editor.setDecorations(decoration, []);
        });
    }

    private clearInlineColorDecorations(editor: vscode.TextEditor): void {
        Array.from(this.decorationManager.getInlineColorDecorations().values()).forEach(decoration => {
            editor.setDecorations(decoration, []);
        });
    }
}