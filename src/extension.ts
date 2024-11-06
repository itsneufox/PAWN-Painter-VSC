import * as vscode from 'vscode';

interface GameTextColor {
    baseColor: vscode.Color;
    symbol: string;
}

const gameTextColors: { [key: string]: GameTextColor } = {
    'r': { baseColor: new vscode.Color(0.61, 0.09, 0.10, 1), symbol: '~r~' },
    'g': { baseColor: new vscode.Color(0.18, 0.35, 0.15, 1), symbol: '~g~' },
    'b': { baseColor: new vscode.Color(0.17, 0.20, 0.43, 1), symbol: '~b~' },
    'y': { baseColor: new vscode.Color(0.77, 0.65, 0.34, 1), symbol: '~y~' },
    'p': { baseColor: new vscode.Color(0.57, 0.37, 0.85, 1), symbol: '~p~' },
    'w': { baseColor: new vscode.Color(0.77, 0.77, 0.77, 1), symbol: '~w~' },
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
    'w': [
        new vscode.Color(0.87, 0.87, 0.87, 1)
    ]
};

let normalColorPickerEnabled: boolean;
let gameTextColorPickerEnabled: boolean;
let hexColorHighlightEnabled: boolean;
let hexColorHighlightStyle: 'underline' | 'background';
let diagnosticCollection: vscode.DiagnosticCollection;
let gameTextDecorationTypes: { [key: string]: vscode.TextEditorDecorationType } = {};
let hexColorDecorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();

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

function parseColor(colorCode: string): { color: vscode.Color, hasZeroAlpha?: boolean } | undefined {
    try {
        if (colorCode.startsWith("0x")) {
            const hex = colorCode.slice(2);
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            let a = hex.length > 6 ? parseInt(hex.substr(6, 2), 16) / 255 : 1;
            
            const hasZeroAlpha = hex.length > 6 && hex.substr(6, 2).toLowerCase() === '00';
            if (hasZeroAlpha) {
                a = 1;
            }
            
            return {
                color: new vscode.Color(r, g, b, a),
                hasZeroAlpha
            };
        } else if (colorCode.startsWith("{") && colorCode.endsWith("}")) {
            const hex = colorCode.slice(1, -1);
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            return { color: new vscode.Color(r, g, b, 1) };
        } else {
            const r = parseInt(colorCode.substr(0, 2), 16) / 255;
            const g = parseInt(colorCode.substr(2, 2), 16) / 255;
            const b = parseInt(colorCode.substr(4, 2), 16) / 255;
            return { color: new vscode.Color(r, g, b, 1) };
        }
    } catch (e) {
        return undefined;
    }
}

function colorToHexWithoutAlpha(color: vscode.Color): string {
    const r = Math.round(color.red * 255).toString(16).padStart(2, "0").toUpperCase();
    const g = Math.round(color.green * 255).toString(16).padStart(2, "0").toUpperCase();
    const b = Math.round(color.blue * 255).toString(16).padStart(2, "0").toUpperCase();
    return `#${r}${g}${b}`;
}

function colorToHexWithAlpha(color: vscode.Color): string {
    const r = Math.round(color.red * 255).toString(16).padStart(2, "0").toUpperCase();
    const g = Math.round(color.green * 255).toString(16).padStart(2, "0").toUpperCase();
    const b = Math.round(color.blue * 255).toString(16).padStart(2, "0").toUpperCase();
    const a = Math.round(color.alpha * 255).toString(16).padStart(2, "0").toUpperCase();
    return `#${r}${g}${b}${a}`;
}

function colorToRGBA(color: vscode.Color): string {
    const r = Math.round(color.red * 255);
    const g = Math.round(color.green * 255);
    const b = Math.round(color.blue * 255);
    const a = color.alpha;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function updateGameTextDecorations(editor: vscode.TextEditor) {
    if (!gameTextColorPickerEnabled || !editor) {
        Object.values(gameTextDecorationTypes).forEach(decorationType => {
            editor.setDecorations(decorationType, []);
        });
        return;
    }

    const text = editor.document.getText();
    const quotedTextRegex = /"[^"]*"/g;
    const gameTextRegex = /~([rgbwypl])~(?:~h~)*/g;
    const decorationsMap: { [key: string]: vscode.DecorationOptions[] } = {};

    let quotedMatch;
    while ((quotedMatch = quotedTextRegex.exec(text)) !== null) {
        const quotedContent = quotedMatch[0];
        const matches: Array<{
            colorChar: string,
            lightLevels: number,
            startIndex: number,
            length: number
        }> = [];

        let gameTextMatch;
        gameTextRegex.lastIndex = 0;
        
        while ((gameTextMatch = gameTextRegex.exec(quotedContent)) !== null) {
            const fullMatch = gameTextMatch[0];
            matches.push({
                colorChar: gameTextMatch[1],
                lightLevels: (fullMatch.match(/~h~/g) || []).length,
                startIndex: gameTextMatch.index,
                length: fullMatch.length
            });
        }

        for (let i = 0; i < matches.length; i++) {
            const currentMatch = matches[i];
            const nextMatch = matches[i + 1];
            
            if (currentMatch.colorChar in gameTextColors) {
                const absoluteStart = quotedMatch.index + currentMatch.startIndex;

                let colorSectionEnd;
                if (nextMatch) {
                    colorSectionEnd = nextMatch.startIndex;
                } else {
                    colorSectionEnd = quotedContent.length - 1;
                }
                
                const rangeStart = editor.document.positionAt(absoluteStart + currentMatch.length);
                const rangeEnd = editor.document.positionAt(quotedMatch.index + colorSectionEnd);
                const range = new vscode.Range(rangeStart, rangeEnd);

                const baseColor = gameTextColors[currentMatch.colorChar].baseColor;
                const finalColor = getLightenedColor(baseColor, currentMatch.lightLevels);
                
                const decorationKey = `${currentMatch.colorChar}_${currentMatch.lightLevels}`;
                
                if (!decorationsMap[decorationKey]) {
                    decorationsMap[decorationKey] = [];
                }
                
                decorationsMap[decorationKey].push({ range });
            }
        }
    }

    Object.entries(gameTextColors).forEach(([key, color]) => {
        const baseDecorationKey = `${key}_0`;
        if (!gameTextDecorationTypes[baseDecorationKey]) {
            gameTextDecorationTypes[baseDecorationKey] = vscode.window.createTextEditorDecorationType({
                color: colorToRGBA(color.baseColor),
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
            });
        }

        if (key in lightenedColors) {
            lightenedColors[key].forEach((lightenedColor, index) => {
                const lightDecorationKey = `${key}_${index + 1}`;
                if (!gameTextDecorationTypes[lightDecorationKey]) {
                    gameTextDecorationTypes[lightDecorationKey] = vscode.window.createTextEditorDecorationType({
                        color: colorToRGBA(lightenedColor),
                        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
                    });
                }
            });
        }
    });

    Object.entries(decorationsMap).forEach(([decorationKey, decorations]) => {
        if (gameTextDecorationTypes[decorationKey]) {
            editor.setDecorations(gameTextDecorationTypes[decorationKey], decorations);
        }
    });
}

function updateHexColorDecorations(editor: vscode.TextEditor) {
    if (!hexColorHighlightEnabled || !editor) {
        hexColorDecorationTypes.forEach(decoration => {
            editor.setDecorations(decoration, []);
        });
        return;
    }

    hexColorDecorationTypes.forEach(decoration => {
        decoration.dispose();
    });
    hexColorDecorationTypes.clear();

    const text = editor.document.getText();
    const colorRegex = /(?:0x[0-9A-Fa-f]{6,8}|\{[0-9A-Fa-f]{6}\}|\b[0-9A-Fa-f]{6}\b)/g;
    const decorationsMap = new Map<string, vscode.DecorationOptions[]>();

    let match;
    while ((match = colorRegex.exec(text)) !== null) {
        const colorCode = match[0];
        const parseResult = parseColor(colorCode);
        
        if (parseResult) {
            const range = new vscode.Range(
                editor.document.positionAt(match.index),
                editor.document.positionAt(match.index + colorCode.length)
            );

            const color = parseResult.color;
            const colorKey = colorToHexWithAlpha(color);

            if (!decorationsMap.has(colorKey)) {
                decorationsMap.set(colorKey, []);

                const decorationType = vscode.window.createTextEditorDecorationType({
                    ...(hexColorHighlightStyle === 'background' ? {
                        backgroundColor: colorToRGBA({ ...color, alpha: 0.3 }),
                        border: `1px solid ${colorToRGBA(color)}`
                    } : {
                        textDecoration: `none; border-bottom: 2px solid ${colorToRGBA(color)}`
                    })
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

const colorProvider: vscode.DocumentColorProvider = {
    provideDocumentColors(document) {
        const colorRanges: vscode.ColorInformation[] = [];
        
        if (!normalColorPickerEnabled) {
            if (vscode.window.activeTextEditor) {
                hexColorDecorationTypes.forEach(decoration => {
                    vscode.window.activeTextEditor!.setDecorations(decoration, []);
                });
            }
            return colorRanges;
        }

        diagnosticCollection.set(document.uri, []);
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const colorRegex = /(?:0x[0-9A-Fa-f]{6,8}|\{[0-9A-Fa-f]{6}\}|\b[0-9A-Fa-f]{6}\b)/g;            
        let match;
        while ((match = colorRegex.exec(text)) !== null) {
            const colorCode = match[0];
            const range = new vscode.Range(
                document.positionAt(match.index),
                document.positionAt(match.index + colorCode.length)
            );
            const parseResult = parseColor(colorCode);
            if (parseResult) {
                colorRanges.push(new vscode.ColorInformation(range, parseResult.color));
                
                if (parseResult.hasZeroAlpha) {
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        "This colour has alpha value of 00.\r\n" +
                        "This might be intentional if you plan to set\r\n" +
                        "the alpha value later using bitwise operations.",
                        vscode.DiagnosticSeverity.Information
                    );
                    diagnostics.push(diagnostic);
                }
            }
        }

        if (diagnostics.length > 0) {
            diagnosticCollection.set(document.uri, diagnostics);
        }

        return colorRanges;
    },

    provideColorPresentations(color, context) {
        const originalText = context.document.getText(context.range).trim();
        
        if (!normalColorPickerEnabled) {
            return [];
        }

        if (originalText.startsWith("{") && originalText.endsWith("}")) {
            const colorHex = colorToHexWithoutAlpha(color);
            return [new vscode.ColorPresentation(`{${colorHex.slice(1)}}`)]
        } else if (originalText.startsWith("0x")) {
            const hasAlpha = originalText.length === 10;
            if (hasAlpha && originalText.slice(-2).toLowerCase() === '00') {
                const colorHex = colorToHexWithoutAlpha(color);
                return [new vscode.ColorPresentation(`0x${colorHex.slice(1)}00`)]
            } else if (hasAlpha) {
                return [new vscode.ColorPresentation(`0x${colorToHexWithAlpha(color).slice(1)}`)]
            } else {
                return [new vscode.ColorPresentation(`0x${colorToHexWithoutAlpha(color).slice(1)}`)]
            }
        } else {
            return [new vscode.ColorPresentation(colorToHexWithoutAlpha(color).slice(1))];
        }
    }
};

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('pawnpainter');

    normalColorPickerEnabled = config.get('enableColorPicker', true);
    gameTextColorPickerEnabled = config.get('enableGameTextColors', false);

    hexColorHighlightEnabled = config.get('enableHexColorHighlight', true);
    hexColorHighlightStyle = config.get('hexColorHighlightStyle', 'underline');

    diagnosticCollection = vscode.languages.createDiagnosticCollection('pawnpainter');
    context.subscriptions.push(diagnosticCollection);
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                updateGameTextDecorations(editor);
                updateHexColorDecorations(editor);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === vscode.window.activeTextEditor?.document) {
                const editor = vscode.window.activeTextEditor;
                updateGameTextDecorations(editor);
                updateHexColorDecorations(editor);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pawnpainter.toggleHexColorHighlight", async () => {
            const config = vscode.workspace.getConfiguration('pawnpainter');
            hexColorHighlightEnabled = !config.get('enableHexColorHighlight', true);
            await config.update('enableHexColorHighlight', hexColorHighlightEnabled, vscode.ConfigurationTarget.Global);
            
            if (vscode.window.activeTextEditor) {
                updateHexColorDecorations(vscode.window.activeTextEditor);
            }
            
            vscode.window.showInformationMessage(
                `Hex Colour Highlighting ${hexColorHighlightEnabled ? 'enabled' : 'disabled'}`
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pawnpainter.toggleGameTextColorPicker", async () => {
            const config = vscode.workspace.getConfiguration('pawnpainter');
            gameTextColorPickerEnabled = !config.get('enableGameTextColors', false);
            await config.update('enableGameTextColors', gameTextColorPickerEnabled, vscode.ConfigurationTarget.Global);
            if (vscode.window.activeTextEditor) {
                updateGameTextDecorations(vscode.window.activeTextEditor);
            }
            vscode.window.showInformationMessage(
                `GameText Colour Preview ${gameTextColorPickerEnabled ? 'enabled' : 'disabled'}`
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("pawnpainter.toggleNormalColorPicker", async () => {
            const config = vscode.workspace.getConfiguration('pawnpainter');
            normalColorPickerEnabled = !config.get('enableColorPicker', true);
            await config.update('enableColorPicker', normalColorPickerEnabled, vscode.ConfigurationTarget.Global);
            
            if (!normalColorPickerEnabled && vscode.window.activeTextEditor) {
                hexColorDecorationTypes.forEach(decoration => {
                    vscode.window.activeTextEditor!.setDecorations(decoration, []);
                });
            }
            
            vscode.window.showInformationMessage(
                `Normal Colour Picker ${normalColorPickerEnabled ? 'enabled' : 'disabled'}`
            );
        })
    );

    context.subscriptions.push(
        vscode.languages.registerColorProvider(
            { language: "pawn", scheme: "file" },
            colorProvider
        )
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            const config = vscode.workspace.getConfiguration('pawnpainter');
            const editor = vscode.window.activeTextEditor;
            
            if (e.affectsConfiguration('pawnpainter.enableColorPicker')) {
                normalColorPickerEnabled = config.get('enableColorPicker', true);
                if (!normalColorPickerEnabled && editor) {
                    hexColorDecorationTypes.forEach(decoration => {
                        editor.setDecorations(decoration, []);
                    });
                }
            }
            if (e.affectsConfiguration('pawnpainter.enableGameTextColors')) {
                gameTextColorPickerEnabled = config.get('enableGameTextColors', false);
                if (editor) {
                    updateGameTextDecorations(editor);
                }
            }
            if (e.affectsConfiguration('pawnpainter.enableHexColorHighlight')) {
                hexColorHighlightEnabled = config.get('enableHexColorHighlight', true);
                if (editor) {
                    updateHexColorDecorations(editor);
                }
            }
            if (e.affectsConfiguration('pawnpainter.hexColorHighlightStyle')) {
                hexColorHighlightStyle = config.get('hexColorHighlightStyle', 'underline');
                if (editor) {
                    updateHexColorDecorations(editor);
                }
            }
        })
    );

    if (vscode.window.activeTextEditor) {
        updateGameTextDecorations(vscode.window.activeTextEditor);
        updateHexColorDecorations(vscode.window.activeTextEditor);
    }
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.clear();
        diagnosticCollection.dispose();
    }
    Object.values(gameTextDecorationTypes).forEach(decorationType => {
        decorationType.dispose();
    });
    hexColorDecorationTypes.forEach(decoration => {
        decoration.dispose();
    });
}