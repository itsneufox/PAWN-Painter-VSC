import * as vscode from 'vscode';
import { IgnoredLinesManager } from './ignoredLinesManager';
import { IgnoredLinesView } from './ignoredLinesView';

export function registerIgnoredLinesCommands(context: vscode.ExtensionContext): void {
    const manager = IgnoredLinesManager.getInstance(context);
    
    context.subscriptions.push(
        vscode.commands.registerCommand('pawnpainter.ignoreLine', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const selections = editor.selections;
            const filePath = editor.document.uri.fsPath;
            const lines: number[] = [];
            const contents: string[] = [];

            selections.forEach(selection => {
                for (let i = selection.start.line; i <= selection.end.line; i++) {
                    lines.push(i);
                    contents.push(editor.document.lineAt(i).text);
                }
            });

            await manager.addIgnoredLines(filePath, lines, contents);
            vscode.window.showInformationMessage(`${lines.length} line(s) colour highlighting ignored`);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('pawnpainter.unignoreLine', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const selections = editor.selections;
            const filePath = editor.document.uri.fsPath;
            const lines: number[] = [];

            selections.forEach(selection => {
                for (let i = selection.start.line; i <= selection.end.line; i++) {
                    if (manager.isLineIgnored(filePath, i)) {
                        lines.push(i);
                    }
                }
            });

            if (lines.length === 0) {
                vscode.window.showInformationMessage('No ignored lines found in selection');
                return;
            }

            await manager.removeIgnoredLines(filePath, lines);
            vscode.window.showInformationMessage(`${lines.length} line(s) colour highlighting restored`);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('pawnpainter.showIgnoredLines', () => {
            IgnoredLinesView.createOrShow(context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('pawnpainter.clearIgnoredLines', async () => {
            const result = await vscode.window.showWarningMessage(
                'Are you sure you want to clear the ignore history?',
                'Yes',
                'No'
            );

            if (result === 'Yes') {
                await manager.clearAllIgnoredLines();
                vscode.window.showInformationMessage('Ignore history has been cleared');
            }
        })
    );
}