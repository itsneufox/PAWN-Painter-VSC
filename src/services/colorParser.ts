import * as vscode from 'vscode';
import { ParsedColor, ColorParseContext } from '../models/colors';
import { FunctionUtils } from '../utils/functionUtils';

export class ColorParser {
    private functionUtils = new FunctionUtils();

    public parseColor(colorCode: string, context?: ColorParseContext): ParsedColor | undefined {
        try {
            if (
                context?.document &&
                context?.position &&
                this.functionUtils.isWithinFunctionCall(context.document, context.position) &&
                !context?.functionName?.match(/(?:Player)?TextDraw(?:Colour|Color)/)
            ) {
                return undefined;
            }

            if (context?.functionName?.match(/(?:Player)?TextDraw(?:Colour|Color)/)) {
                const rgbMatch = colorCode.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
                if (rgbMatch) {
                    const [r, g, b] = rgbMatch;
                    const rVal = Math.min(255, Math.max(0, parseInt(r, 10)));
                    const gVal = Math.min(255, Math.max(0, parseInt(g, 10)));
                    const bVal = Math.min(255, Math.max(0, parseInt(b, 10)));

                    return {
                        color: new vscode.Color(rVal / 255, gVal / 255, bVal / 255, 1),
                    };
                }
            }

            if (colorCode.startsWith('0x')) {
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
                    hasZeroAlpha,
                };
            }

            if (colorCode.startsWith('{') && colorCode.endsWith('}')) {
                const hex = colorCode.slice(1, -1);
                const r = parseInt(hex.substr(0, 2), 16) / 255;
                const g = parseInt(hex.substr(2, 2), 16) / 255;
                const b = parseInt(hex.substr(4, 2), 16) / 255;
                return {
                    color: new vscode.Color(r, g, b, 1),
                };
            }

            if (
                !context?.document ||
                !context?.position ||
                !this.functionUtils.isWithinFunctionCall(context.document, context.position)
            ) {
                const rgbMatch = colorCode.match(
                    /(?<![\d.])\b([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*([0-9]{1,3}))?\b/,
                );
                if (rgbMatch) {
                    const [r, g, b, a] = rgbMatch;
                    if (
                        parseInt(r) <= 255 &&
                        parseInt(g) <= 255 &&
                        parseInt(b) <= 255 &&
                        (!a || parseInt(a) <= 255)
                    ) {
                        return {
                            color: new vscode.Color(
                                parseInt(r) / 255,
                                parseInt(g) / 255,
                                parseInt(b) / 255,
                                a ? parseInt(a) / 255 : 1,
                            ),
                        };
                    }
                }
            }

            return undefined;
        } catch (e) {
            return undefined;
        }
    }

    public parseGameTextColor(
        colorChar: string,
        lightLevels: number = 0,
    ): vscode.Color | undefined {
        const baseColors: { [key: string]: vscode.Color } = {
            r: new vscode.Color(0.61, 0.09, 0.1, 1),
            g: new vscode.Color(0.18, 0.35, 0.15, 1),
            b: new vscode.Color(0.17, 0.2, 0.43, 1),
            y: new vscode.Color(0.77, 0.65, 0.34, 1),
            p: new vscode.Color(0.57, 0.37, 0.85, 1),
            w: new vscode.Color(0.77, 0.77, 0.77, 1),
            s: new vscode.Color(0.77, 0.77, 0.77, 1),
            l: new vscode.Color(0, 0, 0, 1),
        };

        if (!(colorChar in baseColors)) {
            return undefined;
        }

        if (lightLevels === 0) {
            return baseColors[colorChar];
        }

        const baseColor = baseColors[colorChar];
        const lightenFactor = Math.min(lightLevels * 0.2, 0.8);

        return new vscode.Color(
            Math.min(baseColor.red + lightenFactor, 1),
            Math.min(baseColor.green + lightenFactor, 1),
            Math.min(baseColor.blue + lightenFactor, 1),
            baseColor.alpha,
        );
    }
}
