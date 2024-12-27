import * as vscode from 'vscode';

export interface GameTextColor {
    baseColor: vscode.Color;
    symbol: string;
}

export interface ParsedColor {
    color: vscode.Color;
    hasZeroAlpha?: boolean;
}

export interface ColorParseContext {
    functionName?: string;
    document?: vscode.TextDocument;
    position?: vscode.Position;
}

export const GAME_TEXT_COLORS: { [key: string]: GameTextColor } = {
    'r': { baseColor: new vscode.Color(0.61, 0.09, 0.10, 1), symbol: '~r~' },
    'g': { baseColor: new vscode.Color(0.18, 0.35, 0.15, 1), symbol: '~g~' },
    'b': { baseColor: new vscode.Color(0.17, 0.20, 0.43, 1), symbol: '~b~' },
    'y': { baseColor: new vscode.Color(0.77, 0.65, 0.34, 1), symbol: '~y~' },
    'p': { baseColor: new vscode.Color(0.57, 0.37, 0.85, 1), symbol: '~p~' },
    'w': { baseColor: new vscode.Color(0.77, 0.77, 0.77, 1), symbol: '~w~' },
    's': { baseColor: new vscode.Color(0.77, 0.77, 0.77, 1), symbol: '~s~' },
    'l': { baseColor: new vscode.Color(0, 0, 0, 1), symbol: '~l~' },
};

export const LIGHTENED_COLORS: { [key: string]: vscode.Color[] } = {
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