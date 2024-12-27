import * as vscode from 'vscode';
import { GAME_TEXT_COLORS, LIGHTENED_COLORS } from '../models/colors';

export class ColorUtils {
    /**
     * Converts a number to a two-digit hexadecimal string
     */
    private componentToHex(c: number): string {
        const hex = Math.round(c * 255).toString(16).toUpperCase();
        return hex.length === 1 ? '0' + hex : hex;
    }

    /**
     * Converts a Color to hex string without alpha
     */
    public colorToHexWithoutAlpha(color: vscode.Color): string {
        const r = this.componentToHex(color.red);
        const g = this.componentToHex(color.green);
        const b = this.componentToHex(color.blue);
        return `#${r}${g}${b}`;
    }

    /**
     * Converts a Color to hex string with alpha
     */
    public colorToHexWithAlpha(color: vscode.Color): string {
        const r = this.componentToHex(color.red);
        const g = this.componentToHex(color.green);
        const b = this.componentToHex(color.blue);
        const a = this.componentToHex(color.alpha);
        return `#${r}${g}${b}${a}`;
    }

    /**
     * Converts a Color to RGBA string
     */
    public colorToRGBA(color: vscode.Color): string {
        const r = Math.round(color.red * 255);
        const g = Math.round(color.green * 255);
        const b = Math.round(color.blue * 255);
        return `rgba(${r}, ${g}, ${b}, ${color.alpha})`;
    }

    /**
     * Gets a lightened version of a game text color
     */
    public getLightenedColor(baseColor: vscode.Color, level: number): vscode.Color {
        const baseColorKey = Object.keys(GAME_TEXT_COLORS).find(key => {
            const gameColor = GAME_TEXT_COLORS[key];
            return this.colorsMatch(gameColor.baseColor, baseColor);
        });

        if (!baseColorKey || !(baseColorKey in LIGHTENED_COLORS)) {
            return baseColor;
        }

        const colorArray = LIGHTENED_COLORS[baseColorKey];
        return (level > 0 && level - 1 < colorArray.length) ? 
            colorArray[level - 1] : baseColor;
    }

    /**
     * Checks if two colors match
     */
    private colorsMatch(color1: vscode.Color, color2: vscode.Color): boolean {
        return color1.red === color2.red &&
               color1.green === color2.green &&
               color1.blue === color2.blue &&
               color1.alpha === color2.alpha;
    }

    /**
     * Creates a color with modified alpha
     */
    public withAlpha(color: vscode.Color, alpha: number): vscode.Color {
        return new vscode.Color(
            color.red,
            color.green,
            color.blue,
            alpha
        );
    }

    /**
     * Lightens a color by a certain amount
     */
    public lighten(color: vscode.Color, amount: number): vscode.Color {
        return new vscode.Color(
            Math.min(1, color.red + amount),
            Math.min(1, color.green + amount),
            Math.min(1, color.blue + amount),
            color.alpha
        );
    }

    /**
     * Darkens a color by a certain amount
     */
    public darken(color: vscode.Color, amount: number): vscode.Color {
        return new vscode.Color(
            Math.max(0, color.red - amount),
            Math.max(0, color.green - amount),
            Math.max(0, color.blue - amount),
            color.alpha
        );
    }

    /**
     * Validates RGB values
     */
    public isValidRGB(r: number, g: number, b: number): boolean {
        return r >= 0 && r <= 255 &&
               g >= 0 && g <= 255 &&
               b >= 0 && b <= 255;
    }

    /**
     * Validates alpha value
     */
    public isValidAlpha(a: number): boolean {
        return a >= 0 && a <= 255;
    }

    /**
     * Validates hex color string
     */
    public isValidHex(hex: string): boolean {
        return /^#?([0-9A-F]{6}|[0-9A-F]{8})$/i.test(hex);
    }

    /**
     * Parse hex string to RGB values
     */
    public hexToRGB(hex: string): { r: number, g: number, b: number, a?: number } {
        hex = hex.replace('#', '');

        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const a = hex.length === 8 ? parseInt(hex.substr(6, 2), 16) : undefined;

        return { r, g, b, a };
    }
}