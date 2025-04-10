import * as vscode from 'vscode';

export interface ViewportInfo {
    startLine: number;
    endLine: number;
    buffer: number;
}

export class ViewportManager {
    private static readonly DEFAULT_BUFFER_SIZE = 100;

    public static getVisibleRangeWithBuffer(editor: vscode.TextEditor): ViewportInfo {
        const visibleRanges = editor.visibleRanges;
        if (!visibleRanges.length) {
            return {
                startLine: 0,
                endLine: 0,
                buffer: this.DEFAULT_BUFFER_SIZE,
            };
        }

        const firstVisible = visibleRanges[0];
        const lastVisible = visibleRanges[visibleRanges.length - 1];

        const startLine = Math.max(0, firstVisible.start.line - this.DEFAULT_BUFFER_SIZE);
        const endLine = lastVisible.end.line + this.DEFAULT_BUFFER_SIZE;

        return {
            startLine,
            endLine,
            buffer: this.DEFAULT_BUFFER_SIZE,
        };
    }

    public static isWithinViewport(range: vscode.Range, viewport: ViewportInfo): boolean {
        return range.start.line >= viewport.startLine && range.end.line <= viewport.endLine;
    }

    public static getViewportText(editor: vscode.TextEditor, viewport: ViewportInfo): string {
        return editor.document.getText(
            new vscode.Range(
                new vscode.Position(viewport.startLine, 0),
                new vscode.Position(viewport.endLine, Number.MAX_VALUE),
            ),
        );
    }

    public static getAbsoluteOffset(editor: vscode.TextEditor, viewport: ViewportInfo): number {
        return editor.document.offsetAt(new vscode.Position(viewport.startLine, 0));
    }

    public static createRange(
        editor: vscode.TextEditor,
        absoluteStart: number,
        length: number,
    ): vscode.Range {
        const startPos = editor.document.positionAt(absoluteStart);
        const endPos = editor.document.positionAt(absoluteStart + length);
        return new vscode.Range(startPos, endPos);
    }
}
