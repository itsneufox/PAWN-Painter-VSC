import * as vscode from 'vscode';
import * as path from 'path';

interface ViewportInfo {
    startLine: number;
    endLine: number;
    buffer: number;
}

interface GameTextColour {
    baseColour: vscode.Color;
    symbol: string;
}

interface ExtensionConfig {
    general: {
        enableColourPicker: boolean;
    };
    hex: {
        enabled: boolean;
        style: 'text' | 'underline' | 'background';
        showAlphaWarnings: boolean;
    };
    gameText: {
        enabled: boolean;
        style: 'text' | 'underline' | 'background';
    };
    inlineText: {
        enabled: boolean;
        style: 'text' | 'underline' | 'background';
    };
}

let config: ExtensionConfig = {
    general: {
        enableColourPicker: true
    },
    hex: {
        enabled: true,
        style: 'underline',
        showAlphaWarnings: true
    },
    gameText: {
        enabled: true,
        style: 'text'
    },
    inlineText: {
        enabled: true,
        style: 'text'
    }
};

const gameTextColours: { [key: string]: GameTextColour } = {
    'r': { baseColour: new vscode.Color(0.61, 0.09, 0.10, 1), symbol: '~r~' },
    'g': { baseColour: new vscode.Color(0.18, 0.35, 0.15, 1), symbol: '~g~' },
    'b': { baseColour: new vscode.Color(0.17, 0.20, 0.43, 1), symbol: '~b~' },
    'y': { baseColour: new vscode.Color(0.77, 0.65, 0.34, 1), symbol: '~y~' },
    'p': { baseColour: new vscode.Color(0.57, 0.37, 0.85, 1), symbol: '~p~' },
    'w': { baseColour: new vscode.Color(0.77, 0.77, 0.77, 1), symbol: '~w~' },
    's': { baseColour: new vscode.Color(0.77, 0.77, 0.77, 1), symbol: '~s~' },
    'l': { baseColour: new vscode.Color(0, 0, 0, 1), symbol: '~l~' },
};

const lightenedColours: { [key: string]: vscode.Color[] } = {
    'r': [
        new vscode.Color(0.86, 0.12, 0.14, 1),
        new vscode.Color(0.86, 0.19, 0.22, 1),
        new vscode.Color(0.86, 0.28, 0.32, 1),
        new vscode.Color(0.86, 0.42, 0.49, 1),
        new vscode.Color(0.86, 0.62, 0.73, 1)
    ],
    'g': [
        new vscode.Color(0.27, 0.53, 0.22, 1),
        new vscode.Color(0.41, 0.80, 0.34, 1),
        new vscode.Color(0.61, 0.87, 0.50, 1)
    ],
    'b': [
        new vscode.Color(0.25, 0.31, 0.65, 1),
        new vscode.Color(0.38, 0.46, 0.87, 1),
        new vscode.Color(0.57, 0.69, 0.87, 1)
    ],
    'p': [
        new vscode.Color(0.85, 0.56, 0.87, 1),
        new vscode.Color(0.87, 0.84, 0.87, 1)
    ],
    'y': [
        new vscode.Color(0.87, 0.87, 0.50, 1),
        new vscode.Color(0.87, 0.87, 0.75, 1)
    ],
    'w': [new vscode.Color(0.87, 0.87, 0.87, 1)],
    's': [new vscode.Color(0.87, 0.87, 0.87, 1)]
};

let gameTextDecorationTypes: { [key: string]: vscode.TextEditorDecorationType } = {};
let hexColourDecorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
let inlineColourDecorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();

function loadConfiguration() {
    const vsConfig = vscode.workspace.getConfiguration('pawnpainter');
    
    config.general.enableColourPicker = vsConfig.get('general.enableColourPicker', true);
    config.hex.enabled = vsConfig.get('hex.enabled', true);
    config.hex.style = vsConfig.get('hex.style', 'underline');
    config.hex.showAlphaWarnings = vsConfig.get('hex.showAlphaWarnings', true);
    config.gameText.enabled = vsConfig.get('gameText.enabled', true);
    config.gameText.style = vsConfig.get('gameText.style', 'text');
    config.inlineText.enabled = vsConfig.get('inlineText.enabled', true);
    config.inlineText.style = vsConfig.get('inlineText.style', 'text');
}

function getVisibleRangeWithBuffer(editor: vscode.TextEditor): ViewportInfo {
    const visibleRanges = editor.visibleRanges;
    if (!visibleRanges.length) {
        return { startLine: 0, endLine: 0, buffer: 200 };
    }

    const firstVisible = visibleRanges[0];
    const lastVisible = visibleRanges[visibleRanges.length - 1];
    
    const bufferSize = 200;
    const startLine = Math.max(0, firstVisible.start.line - bufferSize);
    const endLine = lastVisible.end.line + bufferSize;
    
    return { startLine, endLine, buffer: bufferSize };
}

function isWithinViewport(range: vscode.Range, viewport: ViewportInfo): boolean {
    return range.start.line >= viewport.startLine && 
           range.end.line <= viewport.endLine;
}

function getLightenedColour(baseColour: vscode.Color, level: number): vscode.Color {
    const baseColourKey = Object.keys(gameTextColours).find(key => {
        const gameColour = gameTextColours[key];
        return gameColour && gameColour.baseColour.red === baseColour.red &&
               gameColour.baseColour.green === baseColour.green &&
               gameColour.baseColour.blue === baseColour.blue &&
               gameColour.baseColour.alpha === baseColour.alpha;
    });
    
    if (!baseColourKey || !(baseColourKey in lightenedColours)) {
        return baseColour;
    }

    const colourArray = lightenedColours[baseColourKey] || [];
    return (level > 0 && level - 1 < colourArray.length) ? colourArray[level - 1] : baseColour;
}

function componentToHex(c: number): string {
    const hex = Math.round(c * 255).toString(16).toUpperCase();
    return hex.length === 1 ? '0' + hex : hex;
}

function colourToHexWithoutAlpha(colour: vscode.Color): string {
    const r = componentToHex(colour.red);
    const g = componentToHex(colour.green);
    const b = componentToHex(colour.blue);
    return `#${r}${g}${b}`;
}

function colourToHexWithAlpha(colour: vscode.Color): string {
    const r = componentToHex(colour.red);
    const g = componentToHex(colour.green);
    const b = componentToHex(colour.blue);
    const a = componentToHex(colour.alpha);
    return `#${r}${g}${b}${a}`;
}

function colourToRGBA(colour: vscode.Color): string {
    const r = Math.round(colour.red * 255);
    const g = Math.round(colour.green * 255);
    const b = Math.round(colour.blue * 255);
    const a = colour.alpha;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function isWithinFunctionCall(document: vscode.TextDocument, position: vscode.Position): boolean {
    const line = document.lineAt(position.line).text;
    const lineUntilPosition = line.substring(0, position.character);
    
    let openParens = 0;
    for (const char of lineUntilPosition) {
        if (char === '(') openParens++;
        if (char === ')') openParens--;
    }
    
    if (openParens > 0) {
        const functionCallRegex = /\b[A-Za-z_][A-Za-z0-9_]*\s*\(/;
        return functionCallRegex.test(lineUntilPosition);
    }
    
    return false;
}

function getFunctionNameAtPosition(document: vscode.TextDocument, position: vscode.Position): string | undefined {
    const line = document.lineAt(position.line).text;
    const lineUntilPosition = line.substring(0, position.character);
    
    const functionMatch = lineUntilPosition.match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\([^(]*$/);
    return functionMatch ? functionMatch[1] : undefined;
}

function parseColour(colourCode: string, context?: { 
    functionName?: string, 
    document?: vscode.TextDocument, 
    position?: vscode.Position 
}): { colour: vscode.Color, hasZeroAlpha?: boolean } | undefined {
    try {
        if (context?.document && context?.position && 
            isWithinFunctionCall(context.document, context.position) &&
            !context?.functionName?.match(/(?:Player)?TextDraw(?:Colour|Colour)/)) {
            return undefined;
        }

        if (context?.functionName?.match(/(?:Player)?TextDraw(?:Colour|Colour)/)) {
            const rgbMatch = colourCode.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
            if (rgbMatch) {
                const [_, r, g, b] = rgbMatch;
                const rVal = Math.min(255, Math.max(0, parseInt(r, 10)));
                const gVal = Math.min(255, Math.max(0, parseInt(g, 10)));
                const bVal = Math.min(255, Math.max(0, parseInt(b, 10)));
                
                return {
                    colour: new vscode.Color(rVal / 255, gVal / 255, bVal / 255, 1)
                };
            }
        }

        if (colourCode.startsWith("0x")) {
            const hex = colourCode.slice(2);
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            let a = hex.length > 6 ? parseInt(hex.substr(6, 2), 16) / 255 : 1;
            
            const hasZeroAlpha = hex.length > 6 && hex.substr(6, 2).toLowerCase() === '00';
            if (hasZeroAlpha) {
                a = 1;
            }
            
            return {
                colour: new vscode.Color(r, g, b, a),
                hasZeroAlpha
            };
        }

        if (colourCode.startsWith("{") && colourCode.endsWith("}")) {
            const hex = colourCode.slice(1, -1);
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            return { colour: new vscode.Color(r, g, b, 1) };
        }


        if (!context?.document || !context?.position || !isWithinFunctionCall(context.document, context.position)) {
            const rgbMatch = colourCode.match(/(?<![\d.])\b([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9]{1,3}))?\b/);
            if (rgbMatch) {
                const [_, r, g, b, a] = rgbMatch;
                if (parseInt(r) <= 255 && parseInt(g) <= 255 && parseInt(b) <= 255 && (!a || parseInt(a) <= 255)) {
                    return {
                        colour: new vscode.Color(
                            parseInt(r) / 255,
                            parseInt(g) / 255,
                            parseInt(b) / 255,
                            a ? parseInt(a) / 255 : 1
                        )
                    };
                }
            }
        }

        return undefined;
    } catch (e) {
        return undefined;
    }
}

function createDecorationFromStyle(colour: vscode.Color, style: 'text' | 'underline' | 'background'): vscode.DecorationRenderOptions {
    switch (style) {
        case 'text':
            return {
                color: colourToRGBA(colour),
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
            };
        case 'underline':
            return {
                textDecoration: `none; border-bottom: 2px solid ${colourToRGBA(colour)}`
            };
        case 'background':
            return {
                backgroundColor: colourToRGBA({ ...colour, alpha: 0.3 }),
                border: `1px solid ${colourToRGBA(colour)}`
            };
    }
}

function disposeGameTextDecorations() {
    Object.values(gameTextDecorationTypes).forEach(decorationType => {
        decorationType.dispose();
    });
    gameTextDecorationTypes = {};
}

function updateGameTextDecorations(editor: vscode.TextEditor) {
    if (!config.gameText.enabled || !editor) {
        Object.values(gameTextDecorationTypes).forEach(decorationType => {
            editor.setDecorations(decorationType, []);
        });
        return;
    }

    const viewport = getVisibleRangeWithBuffer(editor);
    const viewportText = editor.document.getText(new vscode.Range(
        new vscode.Position(viewport.startLine, 0),
        new vscode.Position(viewport.endLine, Number.MAX_VALUE)
    ));

    disposeGameTextDecorations();
    const decorationsMap: { [key: string]: vscode.DecorationOptions[] } = {};

    const quotedTextRegex = /"[^"]*"/g;
    let quotedMatch;

    while ((quotedMatch = quotedTextRegex.exec(viewportText)) !== null) {
        const quotedContent = quotedMatch[0];
        const absoluteStart = quotedMatch.index;

        const segments = [];
        const gameTextRegex = /~([rgbyplws])~(?:~h~)*/g;
        let lastMatchEnd = 0;
        let gameTextMatch;

        gameTextRegex.lastIndex = 0;

        while ((gameTextMatch = gameTextRegex.exec(quotedContent)) !== null) {
            if (gameTextMatch.index > lastMatchEnd) {
                segments.push({
                    text: quotedContent.slice(lastMatchEnd, gameTextMatch.index),
                    startIndex: lastMatchEnd,
                    colourChar: null,
                    lightLevels: 0
                });
            }

            const colourChar = gameTextMatch[1];
            const lightLevels = (gameTextMatch[0].match(/~h~/g) || []).length;
            
            const nextColourMatch = gameTextRegex.exec(quotedContent);
            const endIndex = nextColourMatch ? nextColourMatch.index : quotedContent.length - 1;
            gameTextRegex.lastIndex = nextColourMatch ? nextColourMatch.index : quotedContent.length;

            segments.push({
                text: quotedContent.slice(gameTextMatch.index + gameTextMatch[0].length, endIndex),
                startIndex: gameTextMatch.index + gameTextMatch[0].length,
                colourChar,
                lightLevels
            });

            lastMatchEnd = endIndex;

            if (nextColourMatch) {
                gameTextRegex.lastIndex = nextColourMatch.index;
            }
        }

        const absoluteDocumentStart = editor.document.offsetAt(new vscode.Position(viewport.startLine, 0)) + absoluteStart;

        segments.forEach(segment => {
            if (segment.colourChar && segment.colourChar in gameTextColours && segment.text.length > 0) {
                const absoluteSegmentStart = absoluteDocumentStart + segment.startIndex;
                const rangeStart = editor.document.positionAt(absoluteSegmentStart);
                const rangeEnd = editor.document.positionAt(absoluteSegmentStart + segment.text.length);
                const range = new vscode.Range(rangeStart, rangeEnd);

                if (isWithinViewport(range, viewport)) {
                    const baseColour = gameTextColours[segment.colourChar].baseColour;
                    const finalColour = getLightenedColour(baseColour, segment.lightLevels);
                    
                    const decorationKey = `${segment.colourChar}_${segment.lightLevels}`;
                    if (!decorationsMap[decorationKey]) {
                        decorationsMap[decorationKey] = [];
                        
                        if (!gameTextDecorationTypes[decorationKey]) {
                            gameTextDecorationTypes[decorationKey] = vscode.window.createTextEditorDecorationType(
                                createDecorationFromStyle(finalColour, config.gameText.style)
                            );
                        }
                    }
                    
                    decorationsMap[decorationKey].push({ range });
                }
            }
        });
    }

    Object.entries(decorationsMap).forEach(([decorationKey, decorations]) => {
        if (gameTextDecorationTypes[decorationKey]) {
            editor.setDecorations(gameTextDecorationTypes[decorationKey], decorations);
        }
    });
}

function updateHexColourDecorations(editor: vscode.TextEditor) {
    if (!config.hex.enabled || !editor) {
        hexColourDecorationTypes.forEach(decoration => {
            editor.setDecorations(decoration, []);
            decoration.dispose();
        });
        hexColourDecorationTypes.clear();
        return;
    }

    const viewport = getVisibleRangeWithBuffer(editor);
    const viewportText = editor.document.getText(new vscode.Range(
        new vscode.Position(viewport.startLine, 0),
        new vscode.Position(viewport.endLine, Number.MAX_VALUE)
    ));

    hexColourDecorationTypes.forEach(decoration => {
        editor.setDecorations(decoration, []);
        decoration.dispose();
    });
    hexColourDecorationTypes.clear();

    const decorationsMap = new Map<string, vscode.DecorationOptions[]>();
    const absoluteStart = editor.document.offsetAt(new vscode.Position(viewport.startLine, 0));

    const hexRegex = /\b0x[0-9A-Fa-f]{6,8}\b/g;
    let hexMatch;
    while ((hexMatch = hexRegex.exec(viewportText)) !== null) {
        const colourCode = hexMatch[0];
        const absolutePosition = absoluteStart + hexMatch.index;
        const position = editor.document.positionAt(absolutePosition);
        const functionName = getFunctionNameAtPosition(editor.document, position);
        
        const range = new vscode.Range(
            position,
            editor.document.positionAt(absolutePosition + colourCode.length)
        );
        
        if (isWithinViewport(range, viewport)) {
            const parseResult = parseColour(colourCode, {
                document: editor.document,
                position: position,
                functionName: functionName
            });
            
            if (parseResult) {
                const colour = parseResult.colour;
                const colourKey = colourToHexWithAlpha(colour);

                if (!decorationsMap.has(colourKey)) {
                    decorationsMap.set(colourKey, []);
                    const decorationType = vscode.window.createTextEditorDecorationType({
                        ...createDecorationFromStyle(colour, config.hex.style)
                    });
                    hexColourDecorationTypes.set(colourKey, decorationType);
                }

                decorationsMap.get(colourKey)!.push({
                    range,
                    hoverMessage: config.hex.showAlphaWarnings && parseResult.hasZeroAlpha ? 
                        new vscode.MarkdownString(
                            "This colour has alpha value of 00.\n" +
                            "If it's intentional or you use bitwise operations,\n" +
                            "consider disregarding this message!"
                        ) : undefined
                });
            }
        }
    }

    const bracedRegex = /\{[0-9A-Fa-f]{6}\}/g;
    let bracedMatch;
    while ((bracedMatch = bracedRegex.exec(viewportText)) !== null) {
        const colourCode = bracedMatch[0];
        const absolutePosition = absoluteStart + bracedMatch.index;
        const range = new vscode.Range(
            editor.document.positionAt(absolutePosition),
            editor.document.positionAt(absolutePosition + colourCode.length)
        );
        
        if (isWithinViewport(range, viewport)) {
            const parseResult = parseColour(colourCode);
            if (parseResult) {
                const colour = parseResult.colour;
                const colourKey = colourToHexWithAlpha(colour);

                if (!decorationsMap.has(colourKey)) {
                    decorationsMap.set(colourKey, []);
                    const decorationType = vscode.window.createTextEditorDecorationType({
                        ...createDecorationFromStyle(colour, config.hex.style)
                    });
                    hexColourDecorationTypes.set(colourKey, decorationType);
                }

                decorationsMap.get(colourKey)!.push({ range });
            }
        }
    }

    const rgbRegex = /(?<![\d.])\b([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9]{1,3}))?\b/g;
    let rgbMatch;
    while ((rgbMatch = rgbRegex.exec(viewportText)) !== null) {
        const [full, r, g, b, a] = rgbMatch;
        
        if (parseInt(r) <= 255 && parseInt(g) <= 255 && parseInt(b) <= 255 && (!a || parseInt(a) <= 255)) {
            const absolutePosition = absoluteStart + rgbMatch.index;
            const position = editor.document.positionAt(absolutePosition);
            const functionName = getFunctionNameAtPosition(editor.document, position);
            
            const range = new vscode.Range(
                position,
                editor.document.positionAt(absolutePosition + full.length)
            );

            if (isWithinViewport(range, viewport)) {
                const parseResult = parseColour(full, {
                    document: editor.document,
                    position: position,
                    functionName: functionName
                });

                if (parseResult) {
                    const colour = parseResult.colour;
                    const colourKey = colourToHexWithAlpha(colour);

                    if (!decorationsMap.has(colourKey)) {
                        decorationsMap.set(colourKey, []);
                        const decorationType = vscode.window.createTextEditorDecorationType({
                            ...createDecorationFromStyle(colour, config.hex.style)
                        });
                        hexColourDecorationTypes.set(colourKey, decorationType);
                    }

                    decorationsMap.get(colourKey)!.push({ range });
                }
            }
        }
    }

    decorationsMap.forEach((ranges, colourKey) => {
        const decorationType = hexColourDecorationTypes.get(colourKey);
        if (decorationType) {
            editor.setDecorations(decorationType, ranges);
        }
    });
}

function updateInlineColourDecorations(editor: vscode.TextEditor) {
    if (!config.inlineText.enabled || !editor) {
        inlineColourDecorationTypes.forEach(decoration => {
            editor.setDecorations(decoration, []);
            decoration.dispose();
        });
        inlineColourDecorationTypes.clear();
        return;
    }

    const viewport = getVisibleRangeWithBuffer(editor);
    const viewportText = editor.document.getText(new vscode.Range(
        new vscode.Position(viewport.startLine, 0),
        new vscode.Position(viewport.endLine, Number.MAX_VALUE)
    ));

    inlineColourDecorationTypes.forEach(decoration => {
        editor.setDecorations(decoration, []);
        decoration.dispose();
    });
    inlineColourDecorationTypes.clear();

    const decorationsMap = new Map<string, vscode.DecorationOptions[]>();
    const absoluteStart = editor.document.offsetAt(new vscode.Position(viewport.startLine, 0));

    const quotedTextRegex = /"[^"]*"/g;
    let quotedMatch;

    while ((quotedMatch = quotedTextRegex.exec(viewportText)) !== null) {
        const quotedContent = quotedMatch[0];
        const colourTagRegex = /\{([0-9A-Fa-f]{6})\}(.*?)(?=\{[0-9A-Fa-f]{6}\}|")/g;
        let colourMatch;

        while ((colourMatch = colourTagRegex.exec(quotedContent)) !== null) {
            const [_, colourCode, colouredText] = colourMatch;
            if (!colouredText.trim()) continue;

            const absolutePosition = absoluteStart + quotedMatch.index + colourMatch.index;
            const startPos = absolutePosition + colourMatch[1].length + 2;
            const range = new vscode.Range(
                editor.document.positionAt(startPos),
                editor.document.positionAt(startPos + colouredText.length)
            );

            if (isWithinViewport(range, viewport)) {
                const colour = parseColour(`{${colourCode}}`);
                if (!colour) continue;

                const colourKey = colourToHexWithAlpha(colour.colour);

                if (!decorationsMap.has(colourKey)) {
                    decorationsMap.set(colourKey, []);
                    const decorationType = vscode.window.createTextEditorDecorationType(
                        createDecorationFromStyle(colour.colour, config.inlineText.style)
                    );
                    inlineColourDecorationTypes.set(colourKey, decorationType);
                }

                decorationsMap.get(colourKey)!.push({ range });
            }
        }
    }

    decorationsMap.forEach((ranges, colourKey) => {
        const decorationType = inlineColourDecorationTypes.get(colourKey);
        if (decorationType) {
            editor.setDecorations(decorationType, ranges);
        }
    });
}

const colourProvider: vscode.DocumentColorProvider = {
    provideDocumentColors(document) {
        if (!config.general.enableColourPicker) return [];
        
        const colourRanges: vscode.ColorInformation[] = [];
        const text = document.getText();

        const hexRegex = /(?:0x[0-9A-Fa-f]{6,8}|\{[0-9A-Fa-f]{6}\})/g;            
        let match;
        while ((match = hexRegex.exec(text)) !== null) {
            const colourCode = match[0];
            const range = new vscode.Range(
                document.positionAt(match.index),
                document.positionAt(match.index + colourCode.length)
            );
            const parseResult = parseColour(colourCode);
            if (parseResult) {
                colourRanges.push(new vscode.ColorInformation(range, parseResult.colour));
            }
        }

        const rgbRegex = /(?<![\d.])\b([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9]{1,3}))?\b/g;
        let rgbMatch;
        while ((rgbMatch = rgbRegex.exec(text)) !== null) {
            const [full, r, g, b, a] = rgbMatch;
            if (parseInt(r) <= 255 && parseInt(g) <= 255 && parseInt(b) <= 255 && (!a || parseInt(a) <= 255)) {
                const startPos = rgbMatch.index;
                const range = new vscode.Range(
                    document.positionAt(startPos),
                    document.positionAt(startPos + full.length)
                );
                const colour = new vscode.Color(
                    parseInt(r) / 255,
                    parseInt(g) / 255,
                    parseInt(b) / 255,
                    a ? parseInt(a) / 255 : 1
                );
                colourRanges.push(new vscode.ColorInformation(range, colour));
            }
        }

        return colourRanges;
    },

    provideColorPresentations(colour, context) {
        if (!config.general.enableColourPicker) return [];

        const originalText = context.document.getText(context.range).trim();
        const presentations: vscode.ColorPresentation[] = [];

        if (originalText.includes(',')) {
            const r = Math.round(colour.red * 255);
            const g = Math.round(colour.green * 255);
            const b = Math.round(colour.blue * 255);
            if (originalText.split(',').length > 3) {
                const a = Math.round(colour.alpha * 255);
                presentations.push(new vscode.ColorPresentation(`${r}, ${g}, ${b}, ${a}`));
            } else {
                presentations.push(new vscode.ColorPresentation(`${r}, ${g}, ${b}`));
            }
            return presentations;
        }

        if (originalText.startsWith('{') && originalText.endsWith('}')) {
            const hexColour = colourToHexWithoutAlpha(colour).slice(1);
            presentations.push(new vscode.ColorPresentation(`{${hexColour}}`));
            return presentations;
        }

        if (originalText.startsWith('0x')) {
            const hasAlpha = originalText.length === 10;
            if (hasAlpha) {
                const originalAlpha = originalText.slice(-2);
                if (originalAlpha.toLowerCase() === '00') {
                    const baseHex = colourToHexWithoutAlpha(colour).slice(1);
                    presentations.push(new vscode.ColorPresentation(`0x${baseHex}00`));
                } else {
                    const fullHex = colourToHexWithAlpha(colour).slice(1);
                    presentations.push(new vscode.ColorPresentation(`0x${fullHex}`));
                }
            } else {
                const baseHex = colourToHexWithoutAlpha(colour).slice(1);
                presentations.push(new vscode.ColorPresentation(`0x${baseHex}`));
            }
            return presentations;
        }

        const baseHex = colourToHexWithoutAlpha(colour).slice(1);
        presentations.push(new vscode.ColorPresentation(`0x${baseHex}`));
        return presentations;
    }
};

function getWebviewHtml(panel: vscode.Webview, extensionUri: vscode.Uri, version: string): string {
    const logoPath = vscode.Uri.joinPath(extensionUri, 'images', 'repository-logo.png');
    const logoUri = panel.asWebviewUri(logoPath);

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.cspSource} 'unsafe-inline'; img-src ${panel.cspSource} data:;">
            <title>PAWN Painter</title>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${logoUri}" alt="PAWN Painter" class="logo">
                    <p class="version">Version ${version}</p>
                </div>
                
                <div class="content">
                    <div class="features">
                        <h2>Key Features</h2>
                        <ul>
                            <li>
                                <span class="feature-dot blue"></span>
                                Real-time colour highlighting for hex codes and RGB values
                            </li>
                            <li>
                                <span class="feature-dot green"></span>
                                Gametext colour previews with support for colour intensities
                            </li>
                            <li>
                                <span class="feature-dot purple"></span>
                                Built-in colour picker for easy colour selection
                            </li>
                            <li>
                                <span class="feature-dot orange"></span>
                                Customizable highlighting styles
                            </li>
                        </ul>
                    </div>

                    <div class="changelog-grid">
                        <div class="changelog-box">
                            <h3>What's New</h3>
                            <ul>
                                <li>
                                    <span class="feature-dot blue"></span>
                                    Better colour detection when colours are used inside functions
                                </li>
                                <li>
                                    <span class="feature-dot blue"></span>
                                    Colours now work better in TextDraw functions
                                </li>
                                <li>
                                    <span class="feature-dot blue"></span>
                                    Fixed issues where decimal numbers were incorrectly shown as colours
                                </li>
                                <li>
                                    <span class="feature-dot blue"></span>
                                    The extension is now smarter about where it shows colours
                                </li>
                            </ul>
                        </div>

                        <div class="changelog-box">
                            <h3>Bug Fixes</h3>
                            <ul>
                                <li>
                                    <span class="feature-dot orange"></span>
                                    Fixed decimal numbers being highlighted as colours by mistake
                                </li>
                                <li>
                                    <span class="feature-dot orange"></span>
                                    Fixed some cases where colours weren't showing up correctly
                                </li>
                                <li>
                                    <span class="feature-dot orange"></span>
                                    Fixed alpha (transparency) values not working properly
                                </li>
                                <li>
                                    <span class="feature-dot orange"></span>
                                    Better handling of RGB colour values to prevent errors
                                </li>
                            </ul>
                        </div>

                        <div class="changelog-box">
                            <h3>Improvements</h3>
                            <ul>
                                <li>
                                    <span class="feature-dot green"></span>
                                    Colour detection is now more accurate
                                </li>
                                <li>
                                    <span class="feature-dot green"></span>
                                    Better handling of different colour formats
                                </li>
                                <li>
                                    <span class="feature-dot green"></span>
                                    The extension now checks colours more carefully
                                </li>
                                <li>
                                    <span class="feature-dot green"></span>
                                    Colours work better in more situations
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <button onclick="vscode.postMessage({type: 'close'})">Let's Paint Some Code!</button>
                    <p class="auto-close-text">or wait 30 seconds for this window to close automatically</p>
                </div>
            </div>

            <style>
                body {
                    padding: 20px;
                    colour: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                    background-colour: var(--vscode-editor-background);
                }

                .container {
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .logo {
                    width: 100%;
                    max-width: 800px;
                    height: auto;
                    margin-bottom: 20px;
                }

                .version {
                    colour: var(--vscode-textPreformat-foreground);
                    font-size: 14px;
                    margin-top: 10px;
                }

                .features h2 {
                    colour: var(--vscode-textLink-foreground);
                    font-size: 18px;
                    margin-bottom: 15px;
                }

                .feature-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 10px;
                    margin-top: 6px;
                    flex-shrink: 0;
                }

                .blue { background-colour: #007acc; }
                .green { background-colour: #28a745; }
                .purple { background-colour: #6f42c1; }
                .orange { background-colour: #f66a0a; }

                .changelog-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-top: 30px;
                }

                .changelog-box {
                    background-colour: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-widget-border);
                    border-radius: 6px;
                    padding: 15px;
                }

                .changelog-box h3 {
                    colour: var(--vscode-textLink-foreground);
                    font-size: 16px;
                    margin-bottom: 15px;
                    margin-top: 0;
                }

                .changelog-box ul {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                }

                .changelog-box li {
                    display: flex;
                    align-items: flex-start;
                    margin-bottom: 12px;
                    line-height: 1.4;
                }

                .footer {
                    text-align: center;
                    margin-top: 30px;
                }

                button {
                    background-colour: var(--vscode-button-background);
                    colour: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }

                button:hover {
                    background-colour: var(--vscode-button-hoverBackground);
                }

                .auto-close-text {
                    margin-top: 10px;
                    colour: var(--vscode-descriptionForeground);
                    font-size: 12px;
                    opacity: 0.8;
                }
            </style>
            <script>
                const vscode = acquireVsCodeApi();
            </script>
        </body>
        </html>`;
}

function showSplashScreen(context: vscode.ExtensionContext, version: string) {
    const panel = vscode.window.createWebviewPanel(
        'pawnPainterSplash',
        'PAWN Painter',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [context.extensionUri]
        }
    );

    panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri, version);

    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.type) {
                case 'close':
                    panel.dispose();
                    break;
            }
        },
        undefined,
        context.subscriptions
    );

    let isDisposed = false;
    setTimeout(() => {
        if (!isDisposed) {
            panel.dispose();
        }
    }, 30000);

    panel.onDidDispose(() => {
        isDisposed = true;
    }, null, context.subscriptions);
}

export function activate(context: vscode.ExtensionContext) {
    const currentVersion = vscode.extensions.getExtension('itsneufox.pawn-painter')?.packageJSON.version;
    const lastVersion = context.globalState.get('pawnpainter.lastVersion');
    const isFirstInstall = !lastVersion;

    if (currentVersion) {
        if (isFirstInstall) {
            showSplashScreen(context, currentVersion);
        } else if (currentVersion !== lastVersion) {
            showSplashScreen(context, currentVersion);
        }
        context.globalState.update('pawnpainter.lastVersion', currentVersion);
    }

    loadConfiguration();

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                updateGameTextDecorations(editor);
                updateHexColourDecorations(editor);
                updateInlineColourDecorations(editor);
            }
        }),

        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document) {
                updateGameTextDecorations(editor);
                updateHexColourDecorations(editor);
                updateInlineColourDecorations(editor);
            }
        }),

        vscode.window.onDidChangeTextEditorVisibleRanges(event => {
            if (event.textEditor) {
                updateGameTextDecorations(event.textEditor);
                updateHexColourDecorations(event.textEditor);
                updateInlineColourDecorations(event.textEditor);
            }
        }),

        vscode.workspace.onDidChangeConfiguration(e => {
            if ([
                'general.enableColourPicker',
                'hex.enabled',
                'hex.style',
                'hex.showAlphaWarnings',
                'gameText.enabled',
                'gameText.style',
                'inlineText.enabled',
                'inlineText.style'
            ].some(setting => e.affectsConfiguration(`pawnpainter.${setting}`))) {
                loadConfiguration();
                
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    updateGameTextDecorations(editor);
                    updateHexColourDecorations(editor);
                    updateInlineColourDecorations(editor);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.languages.registerColorProvider(
            { language: "pawn", scheme: "file" },
            colourProvider
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pawnpainter.toggleHexColourHighlight", async () => {
            const vsConfig = vscode.workspace.getConfiguration('pawnpainter');
            config.hex.enabled = !config.hex.enabled;
            await vsConfig.update('hex.enabled', config.hex.enabled, vscode.ConfigurationTarget.Global);
            if (vscode.window.activeTextEditor) {
                updateHexColourDecorations(vscode.window.activeTextEditor);
            }
            vscode.window.showInformationMessage(
                `Hex Colour Highlighting ${config.hex.enabled ? 'enabled' : 'disabled'}`
            );
        }),

        vscode.commands.registerCommand("pawnpainter.toggleInlineColours", async () => {
            const vsConfig = vscode.workspace.getConfiguration('pawnpainter');
            config.inlineText.enabled = !config.inlineText.enabled;
            await vsConfig.update('inlineText.enabled', config.inlineText.enabled, vscode.ConfigurationTarget.Global);
            if (vscode.window.activeTextEditor) {
                updateInlineColourDecorations(vscode.window.activeTextEditor);
            }
            vscode.window.showInformationMessage(
                `Inline Colour Highlighting ${config.inlineText.enabled ? 'enabled' : 'disabled'}`
            );
        }),

        vscode.commands.registerCommand("pawnpainter.toggleGameTextColourPicker", async () => {
            const vsConfig = vscode.workspace.getConfiguration('pawnpainter');
            config.gameText.enabled = !config.gameText.enabled;
            await vsConfig.update('gameText.enabled', config.gameText.enabled, vscode.ConfigurationTarget.Global);
            if (vscode.window.activeTextEditor) {
                updateGameTextDecorations(vscode.window.activeTextEditor);
            }
            vscode.window.showInformationMessage(
                `GameText Colour Preview ${config.gameText.enabled ? 'enabled' : 'disabled'}`
            );
        }),

        vscode.commands.registerCommand("pawnpainter.toggleNormalColourPicker", async () => {
            const vsConfig = vscode.workspace.getConfiguration('pawnpainter');
            config.general.enableColourPicker = !config.general.enableColourPicker;
            await vsConfig.update('general.enableColourPicker', config.general.enableColourPicker, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(
                `Normal Colour Picker ${config.general.enableColourPicker ? 'enabled' : 'disabled'}`
            );
        })
    );

    if (vscode.window.activeTextEditor) {
        updateGameTextDecorations(vscode.window.activeTextEditor);
        updateHexColourDecorations(vscode.window.activeTextEditor);
        updateInlineColourDecorations(vscode.window.activeTextEditor);
    }
}

export function deactivate() {
    Object.values(gameTextDecorationTypes).forEach(decorationType => {
        decorationType.dispose();
    });
    hexColourDecorationTypes.forEach(decoration => {
        decoration.dispose();
    });
    inlineColourDecorationTypes.forEach(decoration => {
        decoration.dispose();
    });
}