import * as vscode from 'vscode';

interface GameTextColor {
    baseColor: vscode.Color;
    symbol: string;
}

interface ExtensionConfig {
    general: {
        enableColorPicker: boolean;
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
        enableColorPicker: true
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

const gameTextColors: { [key: string]: GameTextColor } = {
    'r': { baseColor: new vscode.Color(0.61, 0.09, 0.10, 1), symbol: '~r~' },
    'g': { baseColor: new vscode.Color(0.18, 0.35, 0.15, 1), symbol: '~g~' },
    'b': { baseColor: new vscode.Color(0.17, 0.20, 0.43, 1), symbol: '~b~' },
    'y': { baseColor: new vscode.Color(0.77, 0.65, 0.34, 1), symbol: '~y~' },
    'p': { baseColor: new vscode.Color(0.57, 0.37, 0.85, 1), symbol: '~p~' },
    'w': { baseColor: new vscode.Color(0.77, 0.77, 0.77, 1), symbol: '~w~' },
    's': { baseColor: new vscode.Color(0.77, 0.77, 0.77, 1), symbol: '~s~' },
    'l': { baseColor: new vscode.Color(0, 0, 0, 1), symbol: '~l~' },
};

const lightenedColors: { [key: string]: vscode.Color[] } = {
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
let hexColorDecorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
let inlineColorDecorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();

function loadConfiguration() {
    const vsConfig = vscode.workspace.getConfiguration('pawnpainter');
    
    config.general.enableColorPicker = vsConfig.get('general.enableColorPicker', true);
    
    config.hex.enabled = vsConfig.get('hex.enabled', true);
    config.hex.style = vsConfig.get('hex.style', 'underline');
    config.hex.showAlphaWarnings = vsConfig.get('hex.showAlphaWarnings', true);
    
    config.gameText.enabled = vsConfig.get('gameText.enabled', true);
    config.gameText.style = vsConfig.get('gameText.style', 'text');
    
    config.inlineText.enabled = vsConfig.get('inlineText.enabled', true);
    config.inlineText.style = vsConfig.get('inlineText.style', 'text');
}

function getLightenedColor(baseColor: vscode.Color, level: number): vscode.Color {
    const baseColorKey = Object.keys(gameTextColors).find(key => {
        const gameColor = gameTextColors[key];
        return gameColor && gameColor.baseColor.red === baseColor.red &&
               gameColor.baseColor.green === baseColor.green &&
               gameColor.baseColor.blue === baseColor.blue &&
               gameColor.baseColor.alpha === baseColor.alpha;
    });
    
    if (!baseColorKey || !(baseColorKey in lightenedColors)) {
        return baseColor;
    }

    const colorArray = lightenedColors[baseColorKey] || [];
    return (level > 0 && level - 1 < colorArray.length) ? colorArray[level - 1] : baseColor;
}

function componentToHex(c: number): string {
    const hex = Math.round(c * 255).toString(16).toUpperCase();
    return hex.length === 1 ? '0' + hex : hex;
}

function colorToHexWithoutAlpha(color: vscode.Color): string {
    const r = componentToHex(color.red);
    const g = componentToHex(color.green);
    const b = componentToHex(color.blue);
    return `#${r}${g}${b}`;
}

function colorToHexWithAlpha(color: vscode.Color): string {
    const r = componentToHex(color.red);
    const g = componentToHex(color.green);
    const b = componentToHex(color.blue);
    const a = componentToHex(color.alpha);
    return `#${r}${g}${b}${a}`;
}

function colorToRGBA(color: vscode.Color): string {
    const r = Math.round(color.red * 255);
    const g = Math.round(color.green * 255);
    const b = Math.round(color.blue * 255);
    const a = color.alpha;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function parseColor(colorCode: string, context?: { functionName?: string }): { color: vscode.Color, hasZeroAlpha?: boolean } | undefined {
    try {
                if (context?.functionName?.match(/(?:Player)?TextDraw(?:Color|Colour)/)) {
            const rgbMatch = colorCode.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
            if (rgbMatch) {
                const [_, r, g, b] = rgbMatch;
                const rVal = Math.min(255, Math.max(0, parseInt(r, 10)));
                const gVal = Math.min(255, Math.max(0, parseInt(g, 10)));
                const bVal = Math.min(255, Math.max(0, parseInt(b, 10)));
                
                return {
                    color: new vscode.Color(rVal / 255, gVal / 255, bVal / 255, 1)
                };
            }
        }

                if (colorCode.startsWith("0x")) {
            const hex = colorCode.slice(2);
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            let a = hex.length > 6 ? parseInt(hex.substr(6, 2), 16) / 255 : 1;
            
            const hasZeroAlpha = hex.length > 6 && hex.substr(6, 2).toLowerCase() === '00';
            if (hasZeroAlpha) {
                a = 1;             }
            
            return {
                color: new vscode.Color(r, g, b, a),
                hasZeroAlpha
            };
        } 
                else if (colorCode.startsWith("{") && colorCode.endsWith("}")) {
            const hex = colorCode.slice(1, -1);
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            return { color: new vscode.Color(r, g, b, 1) };
        }

                const rgbMatch = colorCode.match(/(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d{1,3}))?/);
        if (rgbMatch) {
            const [_, r, g, b, a] = rgbMatch;
            return {
                color: new vscode.Color(
                    parseInt(r) / 255,
                    parseInt(g) / 255,
                    parseInt(b) / 255,
                    a ? parseInt(a) / 255 : 1
                )
            };
        }

        return undefined;
    } catch (e) {
        return undefined;
    }
}

function createDecorationFromStyle(color: vscode.Color, style: 'text' | 'underline' | 'background'): vscode.DecorationRenderOptions {
    switch (style) {
        case 'text':
            return {
                color: colorToRGBA(color),
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
            };
        case 'underline':
            return {
                textDecoration: `none; border-bottom: 2px solid ${colorToRGBA(color)}`
            };
        case 'background':
            return {
                backgroundColor: colorToRGBA({ ...color, alpha: 0.3 }),
                border: `1px solid ${colorToRGBA(color)}`
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

    disposeGameTextDecorations();

    const text = editor.document.getText();
    const decorationsMap: { [key: string]: vscode.DecorationOptions[] } = {};

    const quotedTextRegex = /"[^"]*"/g;
    let quotedMatch;

    while ((quotedMatch = quotedTextRegex.exec(text)) !== null) {
        const quotedContent = quotedMatch[0];
        const absoluteStart = quotedMatch.index;

        const segments = [];
        let currentIndex = 0;
        const gameTextRegex = /~([rgbyplws])~(?:~h~)*/g;
        let lastMatchEnd = 0;
        let gameTextMatch;

        gameTextRegex.lastIndex = 0;

        while ((gameTextMatch = gameTextRegex.exec(quotedContent)) !== null) {
            if (gameTextMatch.index > lastMatchEnd) {
                segments.push({
                    text: quotedContent.slice(lastMatchEnd, gameTextMatch.index),
                    startIndex: lastMatchEnd,
                    colorChar: null,
                    lightLevels: 0
                });
            }

            const colorChar = gameTextMatch[1];
            const lightLevels = (gameTextMatch[0].match(/~h~/g) || []).length;
            
            const nextColorMatch = gameTextRegex.exec(quotedContent);
            const endIndex = nextColorMatch ? nextColorMatch.index : quotedContent.length - 1;
            gameTextRegex.lastIndex = nextColorMatch ? nextColorMatch.index : quotedContent.length;

            segments.push({
                text: quotedContent.slice(gameTextMatch.index + gameTextMatch[0].length, endIndex),
                startIndex: gameTextMatch.index + gameTextMatch[0].length,
                colorChar,
                lightLevels
            });

            lastMatchEnd = endIndex;

            if (nextColorMatch) {
                gameTextRegex.lastIndex = nextColorMatch.index;
            }
        }

        segments.forEach(segment => {
            if (segment.colorChar && segment.colorChar in gameTextColors && segment.text.length > 0) {
                const rangeStart = editor.document.positionAt(absoluteStart + segment.startIndex);
                const rangeEnd = editor.document.positionAt(absoluteStart + segment.startIndex + segment.text.length);
                const range = new vscode.Range(rangeStart, rangeEnd);

                const baseColor = gameTextColors[segment.colorChar].baseColor;
                const finalColor = getLightenedColor(baseColor, segment.lightLevels);
                
                const decorationKey = `${segment.colorChar}_${segment.lightLevels}`;
                if (!decorationsMap[decorationKey]) {
                    decorationsMap[decorationKey] = [];
                    
                    if (!gameTextDecorationTypes[decorationKey]) {
                        gameTextDecorationTypes[decorationKey] = vscode.window.createTextEditorDecorationType(
                            createDecorationFromStyle(finalColor, config.gameText.style)
                        );
                    }
                }
                
                decorationsMap[decorationKey].push({ range });
            }
        });
    }

    Object.entries(decorationsMap).forEach(([decorationKey, decorations]) => {
        if (gameTextDecorationTypes[decorationKey]) {
            editor.setDecorations(gameTextDecorationTypes[decorationKey], decorations);
        }
    });
}

function updateHexColorDecorations(editor: vscode.TextEditor) {
    if (!config.hex.enabled || !editor) {
        hexColorDecorationTypes.forEach(decoration => {
            editor.setDecorations(decoration, []);
            decoration.dispose();
        });
        hexColorDecorationTypes.clear();
        return;
    }

    hexColorDecorationTypes.forEach(decoration => {
        editor.setDecorations(decoration, []);
        decoration.dispose();
    });
    hexColorDecorationTypes.clear();

    const text = editor.document.getText();
    const decorationsMap = new Map<string, vscode.DecorationOptions[]>();

        const hexRegex = /\b0x[0-9A-Fa-f]{6,8}\b/g;
    let hexMatch;
    while ((hexMatch = hexRegex.exec(text)) !== null) {
        const colorCode = hexMatch[0];
        const range = new vscode.Range(
            editor.document.positionAt(hexMatch.index),
            editor.document.positionAt(hexMatch.index + colorCode.length)
        );
        
        const parseResult = parseColor(colorCode);
        if (parseResult) {
            const color = parseResult.color;
            const colorKey = colorToHexWithAlpha(color);

            if (!decorationsMap.has(colorKey)) {
                decorationsMap.set(colorKey, []);
                const decorationType = vscode.window.createTextEditorDecorationType({
                    ...createDecorationFromStyle(color, config.hex.style)
                });
                hexColorDecorationTypes.set(colorKey, decorationType);
            }

            decorationsMap.get(colorKey)!.push({
                range,
                hoverMessage: config.hex.showAlphaWarnings && parseResult.hasZeroAlpha ? 
                    new vscode.MarkdownString(
                        "This colour has alpha value of 00.  \n" +
                        "If it's intentional or you use bitwise operations,  \n" +
                        "consider disregarding this message!"
                    ) : undefined
            });
        }
    }

        const bracedRegex = /\{[0-9A-Fa-f]{6}\}/g;
    let bracedMatch;
    while ((bracedMatch = bracedRegex.exec(text)) !== null) {
        const colorCode = bracedMatch[0];
        const range = new vscode.Range(
            editor.document.positionAt(bracedMatch.index),
            editor.document.positionAt(bracedMatch.index + colorCode.length)
        );
        
        const parseResult = parseColor(colorCode);
        if (parseResult) {
            const color = parseResult.color;
            const colorKey = colorToHexWithAlpha(color);

            if (!decorationsMap.has(colorKey)) {
                decorationsMap.set(colorKey, []);
                const decorationType = vscode.window.createTextEditorDecorationType({
                    ...createDecorationFromStyle(color, config.hex.style)
                });
                hexColorDecorationTypes.set(colorKey, decorationType);
            }

            decorationsMap.get(colorKey)!.push({ range });
        }
    }

        const rgbRegex = /\b(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d{1,3}))?\b/g;
    let rgbMatch;
    while ((rgbMatch = rgbRegex.exec(text)) !== null) {
        const [full, r, g, b, a] = rgbMatch;
        
                if (parseInt(r) <= 255 && parseInt(g) <= 255 && parseInt(b) <= 255 && (!a || parseInt(a) <= 255)) {
            const range = new vscode.Range(
                editor.document.positionAt(rgbMatch.index),
                editor.document.positionAt(rgbMatch.index + full.length)
            );

            const color = new vscode.Color(
                parseInt(r) / 255,
                parseInt(g) / 255,
                parseInt(b) / 255,
                a ? parseInt(a) / 255 : 1
            );

            const colorKey = colorToHexWithAlpha(color);

            if (!decorationsMap.has(colorKey)) {
                decorationsMap.set(colorKey, []);
                const decorationType = vscode.window.createTextEditorDecorationType({
                    ...createDecorationFromStyle(color, config.hex.style)
                });
                hexColorDecorationTypes.set(colorKey, decorationType);
            }

            decorationsMap.get(colorKey)!.push({ range });
        }
    }

        decorationsMap.forEach((ranges, colorKey) => {
        const decorationType = hexColorDecorationTypes.get(colorKey);
        if (decorationType) {
            editor.setDecorations(decorationType, ranges);
        }
    });
}

function updateInlineColorDecorations(editor: vscode.TextEditor) {
    if (!config.inlineText.enabled || !editor) {
        inlineColorDecorationTypes.forEach(decoration => {
            editor.setDecorations(decoration, []);
            decoration.dispose();
        });
        inlineColorDecorationTypes.clear();
        return;
    }

    inlineColorDecorationTypes.forEach(decoration => {
        editor.setDecorations(decoration, []);
        decoration.dispose();
    });
    inlineColorDecorationTypes.clear();

    const text = editor.document.getText();
    const decorationsMap = new Map<string, vscode.DecorationOptions[]>();

        const quotedTextRegex = /"[^"]*"/g;
    let quotedMatch;

    while ((quotedMatch = quotedTextRegex.exec(text)) !== null) {
        const quotedContent = quotedMatch[0];
        const colorTagRegex = /\{([0-9A-Fa-f]{6})\}(.*?)(?=\{[0-9A-Fa-f]{6}\}|")/g;
        let colorMatch;

        while ((colorMatch = colorTagRegex.exec(quotedContent)) !== null) {
            const [_, colorCode, coloredText] = colorMatch;
            if (!coloredText.trim()) continue;

            const color = parseColor(`{${colorCode}}`);
            if (!color) continue;

            const startPos = quotedMatch.index + colorMatch.index + colorMatch[1].length + 2;             const range = new vscode.Range(
                editor.document.positionAt(startPos),
                editor.document.positionAt(startPos + coloredText.length)
            );

            const colorKey = colorToHexWithAlpha(color.color);

            if (!decorationsMap.has(colorKey)) {
                decorationsMap.set(colorKey, []);
                const decorationType = vscode.window.createTextEditorDecorationType(
                    createDecorationFromStyle(color.color, config.inlineText.style)
                );
                inlineColorDecorationTypes.set(colorKey, decorationType);
            }

            decorationsMap.get(colorKey)!.push({ range });
        }
    }

        decorationsMap.forEach((ranges, colorKey) => {
        const decorationType = inlineColorDecorationTypes.get(colorKey);
        if (decorationType) {
            editor.setDecorations(decorationType, ranges);
        }
    });
}

const colorProvider: vscode.DocumentColorProvider = {
    provideDocumentColors(document) {
        if (!config.general.enableColorPicker) return [];
        
        const colorRanges: vscode.ColorInformation[] = [];
        const text = document.getText();

                const hexRegex = /(?:0x[0-9A-Fa-f]{6,8}|\{[0-9A-Fa-f]{6}\})/g;            
        let match;
        while ((match = hexRegex.exec(text)) !== null) {
            const colorCode = match[0];
            const range = new vscode.Range(
                document.positionAt(match.index),
                document.positionAt(match.index + colorCode.length)
            );
            const parseResult = parseColor(colorCode);
            if (parseResult) {
                colorRanges.push(new vscode.ColorInformation(range, parseResult.color));
            }
        }

                const rgbRegex = /\b(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d{1,3}))?\b/g;
        let rgbMatch;
        while ((rgbMatch = rgbRegex.exec(text)) !== null) {
            const [full, r, g, b, a] = rgbMatch;
            if (parseInt(r) <= 255 && parseInt(g) <= 255 && parseInt(b) <= 255 && (!a || parseInt(a) <= 255)) {
                const startPos = rgbMatch.index;
                const range = new vscode.Range(
                    document.positionAt(startPos),
                    document.positionAt(startPos + full.length)
                );
                const color = new vscode.Color(
                    parseInt(r) / 255,
                    parseInt(g) / 255,
                    parseInt(b) / 255,
                    a ? parseInt(a) / 255 : 1
                );
                colorRanges.push(new vscode.ColorInformation(range, color));
            }
        }

        return colorRanges;
    },

    provideColorPresentations(color, context) {
        if (!config.general.enableColorPicker) return [];

        const originalText = context.document.getText(context.range).trim();
        const presentations: vscode.ColorPresentation[] = [];

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

                if (originalText.startsWith('{') && originalText.endsWith('}')) {
            const hexColor = colorToHexWithoutAlpha(color).slice(1);             presentations.push(new vscode.ColorPresentation(`{${hexColor}}`));
            return presentations;
        }

                if (originalText.startsWith('0x')) {
            const hasAlpha = originalText.length === 10;             if (hasAlpha) {
                                const originalAlpha = originalText.slice(-2);
                if (originalAlpha.toLowerCase() === '00') {
                    const baseHex = colorToHexWithoutAlpha(color).slice(1);
                    presentations.push(new vscode.ColorPresentation(`0x${baseHex}00`));
                } else {
                    const fullHex = colorToHexWithAlpha(color).slice(1);
                    presentations.push(new vscode.ColorPresentation(`0x${fullHex}`));
                }
            } else {
                const baseHex = colorToHexWithoutAlpha(color).slice(1);
                presentations.push(new vscode.ColorPresentation(`0x${baseHex}`));
            }
            return presentations;
        }

                const baseHex = colorToHexWithoutAlpha(color).slice(1);
        presentations.push(new vscode.ColorPresentation(`0x${baseHex}`));
        return presentations;
    }
};

export function activate(context: vscode.ExtensionContext) {
    const currentVersion = vscode.extensions.getExtension('itsneufox.pawn-painter')?.packageJSON.version;
    const lastVersion = context.globalState.get('pawnpainter.lastVersion');

    if (currentVersion && currentVersion !== lastVersion) {
        vscode.window.showInformationMessage('PAWN Painter has been updated!');
        context.globalState.update('pawnpainter.lastVersion', currentVersion);
    }

        loadConfiguration();

        context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                updateGameTextDecorations(editor);
                updateHexColorDecorations(editor);
                updateInlineColorDecorations(editor);
            }
        }),

        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document) {
                updateGameTextDecorations(editor);
                updateHexColorDecorations(editor);
                updateInlineColorDecorations(editor);
            }
        }),

        vscode.workspace.onDidChangeConfiguration(e => {
            if ([
                'general.enableColorPicker',
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
                    updateHexColorDecorations(editor);
                    updateInlineColorDecorations(editor);
                }
            }
        })
    );

        context.subscriptions.push(
        vscode.languages.registerColorProvider(
            { language: "pawn", scheme: "file" },
            colorProvider
        ),
    );

        context.subscriptions.push(
        vscode.commands.registerCommand("pawnpainter.toggleHexColorHighlight", async () => {
            const vsConfig = vscode.workspace.getConfiguration('pawnpainter');
            config.hex.enabled = !config.hex.enabled;
            await vsConfig.update('hex.enabled', config.hex.enabled, vscode.ConfigurationTarget.Global);
            if (vscode.window.activeTextEditor) {
                updateHexColorDecorations(vscode.window.activeTextEditor);
            }
            vscode.window.showInformationMessage(
                `Hex Colour Highlighting ${config.hex.enabled ? 'enabled' : 'disabled'}`
            );
        }),

        vscode.commands.registerCommand("pawnpainter.toggleInlineColors", async () => {
            const vsConfig = vscode.workspace.getConfiguration('pawnpainter');
            config.inlineText.enabled = !config.inlineText.enabled;
            await vsConfig.update('inlineText.enabled', config.inlineText.enabled, vscode.ConfigurationTarget.Global);
            if (vscode.window.activeTextEditor) {
                updateInlineColorDecorations(vscode.window.activeTextEditor);
            }
            vscode.window.showInformationMessage(
                `Inline Colour Highlighting ${config.inlineText.enabled ? 'enabled' : 'disabled'}`
            );
        }),

        vscode.commands.registerCommand("pawnpainter.toggleGameTextColorPicker", async () => {
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

        vscode.commands.registerCommand("pawnpainter.toggleNormalColorPicker", async () => {
            const vsConfig = vscode.workspace.getConfiguration('pawnpainter');
            config.general.enableColorPicker = !config.general.enableColorPicker;
            await vsConfig.update('general.enableColorPicker', config.general.enableColorPicker, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(
                `Normal Colour Picker ${config.general.enableColorPicker ? 'enabled' : 'disabled'}`
            );
        })
    );

        if (vscode.window.activeTextEditor) {
        updateGameTextDecorations(vscode.window.activeTextEditor);
        updateHexColorDecorations(vscode.window.activeTextEditor);
        updateInlineColorDecorations(vscode.window.activeTextEditor);
    }
}

export function deactivate() {
    Object.values(gameTextDecorationTypes).forEach(decorationType => {
        decorationType.dispose();
    });
    hexColorDecorationTypes.forEach(decoration => {
        decoration.dispose();
    });
    inlineColorDecorationTypes.forEach(decoration => {
        decoration.dispose();
    });
}