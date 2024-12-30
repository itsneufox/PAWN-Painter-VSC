import * as vscode from 'vscode';
import * as path from 'path';
import { IgnoredLinesManager } from './ignoredLinesManager';

interface IgnoredLine {
    filePath: string;
    line: number;
    content: string;
}

export class IgnoredLinesView {
    private static currentPanel: vscode.WebviewPanel | undefined;

    public static createOrShow(context: vscode.ExtensionContext) {
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (IgnoredLinesView.currentPanel) {
            IgnoredLinesView.currentPanel.reveal(columnToShowIn);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'ignoredLines',
            'PAWN Painter - Ignore History',
            columnToShowIn || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        IgnoredLinesView.currentPanel = panel;
        
        const manager = IgnoredLinesManager.getInstance();
        const ignoredLines = manager.getAllIgnoredLines();
        
        panel.webview.html = IgnoredLinesView.getWebviewContent(ignoredLines);

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'openFile':
                        const document = await vscode.workspace.openTextDocument(message.filePath);
                        const editor = await vscode.window.showTextDocument(document);
                        const position = new vscode.Position(message.line, 0);
                        editor.selection = new vscode.Selection(position, position);
                        editor.revealRange(new vscode.Range(position, position));
                        break;

                    case 'removeLine':
                        await manager.removeIgnoredLines(message.filePath, [message.line]);
                        panel.webview.html = IgnoredLinesView.getWebviewContent(
                            manager.getAllIgnoredLines()
                        );
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        panel.onDidDispose(
            () => {
                IgnoredLinesView.currentPanel = undefined;
            },
            null,
            context.subscriptions
        );
    }

    private static getWebviewContent(ignoredLines: IgnoredLine[]): string {
        const groupedByFile = ignoredLines.reduce<Record<string, IgnoredLine[]>>((acc, line) => {
            const fileName = path.basename(line.filePath);
            if (!acc[fileName]) {
                acc[fileName] = [];
            }
            acc[fileName].push(line);
            return acc;
        }, {});

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PAWN Painter - Ignore History</title>
            <style>
                body {
                    padding: 20px;
                    color: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                }
                .file-group {
                    margin-bottom: 20px;
                }
                .file-header {
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: var(--vscode-textLink-foreground);
                }
                .line-item {
                    padding: 5px;
                    margin: 5px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-widget-border);
                }
                .line-content {
                    font-family: monospace;
                    margin-right: 10px;
                }
                .action-buttons {
                    display: flex;
                    gap: 5px;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    cursor: pointer;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .line-number {
                    color: var(--vscode-textPreformat-foreground);
                    margin-right: 10px;
                }
                .empty-state {
                    text-align: center;
                    padding: 20px;
                    color: var(--vscode-descriptionForeground);
                }
            </style>
        </head>
        <body>
            ${ignoredLines.length === 0 ? `
                <div class="empty-state">
                    No ignored colours found.<br>
                    Right-click on a line and select "Ignore Colour on Selected Line(s)" to add one.
                </div>
            ` :
            Object.entries(groupedByFile).map(([fileName, lines]) => `
                <div class="file-group">
                    <div class="file-header">${fileName}</div>
                    ${(lines as IgnoredLine[]).map(line => `
                        <div class="line-item">
                            <div>
                                <span class="line-number">Line ${line.line + 1}:</span>
                                <span class="line-content">${escapeHtml(line.content)}</span>
                            </div>
                            <div class="action-buttons">
                                <button onclick="openFile('${escapeHtml(line.filePath)}', ${line.line})">
                                    Go to Line
                                </button>
                                <button onclick="removeLine('${escapeHtml(line.filePath)}', ${line.line})">
                                    Restore
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
            
            <script>
                const vscode = acquireVsCodeApi();

                function openFile(filePath, line) {
                    vscode.postMessage({
                        command: 'openFile',
                        filePath: filePath,
                        line: line
                    });
                }

                function removeLine(filePath, line) {
                    vscode.postMessage({
                        command: 'removeLine',
                        filePath: filePath,
                        line: line
                    });
                }
            </script>
        </body>
        </html>`;
    }
}

function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}