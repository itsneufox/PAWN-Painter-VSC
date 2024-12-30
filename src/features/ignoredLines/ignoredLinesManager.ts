import * as vscode from 'vscode';

interface IgnoredLine {
    filePath: string;
    line: number;
    content: string;
    timestamp: number;
}

export class IgnoredLinesManager {
    private static instance: IgnoredLinesManager;
    private ignoredLines: Map<string, Set<number>> = new Map();
    private lineDetails: IgnoredLine[] = [];
    private context: vscode.ExtensionContext;
    private _onLinesChanged: vscode.EventEmitter<void>;
    public readonly onLinesChanged: vscode.Event<void>;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this._onLinesChanged = new vscode.EventEmitter<void>();
        this.onLinesChanged = this._onLinesChanged.event;
        this.loadIgnoredLines();
    }

    public static getInstance(context?: vscode.ExtensionContext): IgnoredLinesManager {
        if (!IgnoredLinesManager.instance && context) {
            IgnoredLinesManager.instance = new IgnoredLinesManager(context);
        }
        return IgnoredLinesManager.instance;
    }

    private async loadIgnoredLines(): Promise<void> {
        const savedLines = this.context.globalState.get<IgnoredLine[]>('pawnpainter.ignoredLines', []);
        this.lineDetails = savedLines;
        
        this.ignoredLines.clear();
        for (const line of savedLines) {
            if (!this.ignoredLines.has(line.filePath)) {
                this.ignoredLines.set(line.filePath, new Set());
            }
            this.ignoredLines.get(line.filePath)!.add(line.line);
        }
        
        this._onLinesChanged.fire();
    }

    private async saveIgnoredLines(): Promise<void> {
        await this.context.globalState.update('pawnpainter.ignoredLines', this.lineDetails);
        this._onLinesChanged.fire();
    }

    public isLineIgnored(filePath: string, line: number): boolean {
        return this.ignoredLines.has(filePath) && this.ignoredLines.get(filePath)!.has(line);
    }

    public async removeIgnoredLines(filePath: string, lines: number[]): Promise<void> {
        if (!this.ignoredLines.has(filePath)) return;
        
        const lineSet = this.ignoredLines.get(filePath)!;
        lines.forEach(line => lineSet.delete(line));
        this.lineDetails = this.lineDetails.filter(
            detail => !(detail.filePath === filePath && lines.includes(detail.line))
        );
        
        if (lineSet.size === 0) {
            this.ignoredLines.delete(filePath);
        }
        
        await this.saveIgnoredLines();
        this.refreshDecorations();
    }
    
    private refreshDecorations() {
        // Refresh all visible PAWN editors
        vscode.window.visibleTextEditors
            .filter(editor => editor.document.languageId === 'pawn')
            .forEach(async editor => {
                // Force color provider to refresh by toggling language mode
                await vscode.languages.setTextDocumentLanguage(editor.document, 'plaintext');
                await vscode.languages.setTextDocumentLanguage(editor.document, 'pawn');
            });
    }

    public async addIgnoredLines(filePath: string, lines: number[], contents: string[]): Promise<void> {
        if (!this.ignoredLines.has(filePath)) {
            this.ignoredLines.set(filePath, new Set());
        }
        
        const lineSet = this.ignoredLines.get(filePath)!;
        const timestamp = Date.now();
        lines.forEach((line, index) => {
            lineSet.add(line);
            this.lineDetails.push({
                filePath,
                line,
                content: contents[index],
                timestamp
            });
        });
        
        await this.saveIgnoredLines();
        this.refreshDecorations();
    }

    public getAllIgnoredLines(): IgnoredLine[] {
        return [...this.lineDetails].sort((a, b) => b.timestamp - a.timestamp);
    }

    public async clearAllIgnoredLines(): Promise<void> {
        this.ignoredLines.clear();
        this.lineDetails = [];
        await this.saveIgnoredLines();
        this.refreshDecorations();
    }
    
    public dispose() {
        this._onLinesChanged.dispose();
    }
}