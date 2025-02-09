import * as vscode from 'vscode';
import { DecorationStyle } from '../configurations/config';

export interface DecorationOptions {
    range: vscode.Range;
    hoverMessage?: vscode.MarkdownString;
}

export class DecorationManager {
    private static instance: DecorationManager;
    private gameTextDecorations: { [key: string]: vscode.TextEditorDecorationType } = {};
    private hexColorDecorations: Map<string, vscode.TextEditorDecorationType> = new Map();
    private inlineColorDecorations: Map<string, vscode.TextEditorDecorationType> = new Map();

    private constructor() {}

    public static getInstance(): DecorationManager {
        if (!DecorationManager.instance) {
            DecorationManager.instance = new DecorationManager();
        }
        return DecorationManager.instance;
    }

    public getGameTextDecoration(key: string): vscode.TextEditorDecorationType | undefined {
        return this.gameTextDecorations[key];
    }

    public setGameTextDecoration(key: string, decoration: vscode.TextEditorDecorationType): void {
        this.gameTextDecorations[key] = decoration;
    }

    public getAllGameTextDecorations(): { [key: string]: vscode.TextEditorDecorationType } {
        return this.gameTextDecorations;
    }

    public getHexColorDecoration(colorKey: string): vscode.TextEditorDecorationType | undefined {
        return this.hexColorDecorations.get(colorKey);
    }

    public setHexColorDecoration(colorKey: string, decoration: vscode.TextEditorDecorationType): void {
        this.hexColorDecorations.set(colorKey, decoration);
    }

    public getHexColorDecorations(): Map<string, vscode.TextEditorDecorationType> {
        return this.hexColorDecorations;
    }

    public getInlineColorDecoration(colorKey: string): vscode.TextEditorDecorationType | undefined {
        return this.inlineColorDecorations.get(colorKey);
    }

    public setInlineColorDecoration(colorKey: string, decoration: vscode.TextEditorDecorationType): void {
        this.inlineColorDecorations.set(colorKey, decoration);
    }

    public getInlineColorDecorations(): Map<string, vscode.TextEditorDecorationType> {
        return this.inlineColorDecorations;
    }

    public createDecorationFromStyle(color: vscode.Color, style: DecorationStyle): vscode.DecorationRenderOptions {
        const colorRgba = `rgba(${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(color.blue * 255)}, ${color.alpha})`;

        const baseOptions: vscode.DecorationRenderOptions = {
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            isWholeLine: false
        };

        switch (style) {
            case 'text':
                return {
                    ...baseOptions,
                    color: colorRgba,
                };
            case 'underline':
                return {
                    ...baseOptions,
                    textDecoration: `none; border-bottom: 2px solid ${colorRgba}`,
                };
            case 'background':
                return {
                    ...baseOptions,
                    backgroundColor: `rgba(${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(color.blue * 255)}, 0.3)`,
                    border: `1px solid ${colorRgba}`,
                };
            default:
                return baseOptions;
        }
    }

    public disposeGameTextDecorations(): void {
        Object.values(this.gameTextDecorations).forEach(decoration => decoration.dispose());
        this.gameTextDecorations = {};
    }

    public disposeHexColorDecorations(): void {
        this.hexColorDecorations.forEach(decoration => decoration.dispose());
        this.hexColorDecorations.clear();
    }

    public disposeInlineColorDecorations(): void {
        this.inlineColorDecorations.forEach(decoration => decoration.dispose());
        this.inlineColorDecorations.clear();
    }

    public disposeAll(): void {
        this.disposeGameTextDecorations();
        this.disposeHexColorDecorations();
        this.disposeInlineColorDecorations();
        this.hexColorDecorations = new Map();
        this.inlineColorDecorations = new Map();
        this.gameTextDecorations = {};
    }
}