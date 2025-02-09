import * as vscode from 'vscode';
import { UpdateService } from '../../services/updateService';

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
    private disposables: vscode.Disposable[] = [];
    public readonly onLinesChanged: vscode.Event<void>;
    

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this._onLinesChanged = new vscode.EventEmitter<void>();
        this.onLinesChanged = this._onLinesChanged.event;
        this.loadIgnoredLines();

        // Document change listener
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(e => {
                this.handleDocumentChange(e);
            })
        );
    }

    private handleDocumentChange(e: vscode.TextDocumentChangeEvent): void {
        const filePath = e.document.uri.fsPath;
        if (!this.ignoredLines.has(filePath)) {
            return;
        }
    
        // Process each change event
        for (const change of e.contentChanges) {
            const startLine = change.range.start.line;
            const endLine = change.range.end.line;
            const addedLines = change.text.split('\n').length - 1;
            const removedLines = endLine - startLine;
            const lineDelta = addedLines - removedLines;
    
            if (lineDelta !== 0) {
                this.updateLineNumbers(filePath, startLine, lineDelta);
            }
        }
    }
    
    private updateLineNumbers(filePath: string, startLine: number, lineDelta: number): void {
        const lineSet = this.ignoredLines.get(filePath);
        if (!lineSet) return;
    
        // Create new set for updated line numbers
        const newLineSet = new Set<number>();
        
        // Update line details
        this.lineDetails = this.lineDetails.map(detail => {
            if (detail.filePath === filePath && detail.line > startLine) {
                return {
                    ...detail,
                    line: detail.line + lineDelta
                };
            }
            return detail;
        });
    
        // Update line set
        for (const line of lineSet) {
            if (line > startLine) {
                newLineSet.add(line + lineDelta);
            } else {
                newLineSet.add(line);
            }
        }
    
        this.ignoredLines.set(filePath, newLineSet);
        this.saveIgnoredLines();
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
        lines.forEach(line => {
            if (line >= 0) {
                lineSet.delete(line);
            }
        });
        
        this.lineDetails = this.lineDetails.filter(
            detail => !(detail.filePath === filePath && lines.includes(detail.line))
        );
        
        if (lineSet.size === 0) {
            this.ignoredLines.delete(filePath);
        }
        
        await this.saveIgnoredLines();
        this.refreshDecorations();
    }

    public async addIgnoredLines(filePath: string, lines: number[], contents: string[]): Promise<void> {
        if (!this.ignoredLines.has(filePath)) {
            this.ignoredLines.set(filePath, new Set());
        }
        
        const lineSet = this.ignoredLines.get(filePath)!;
        const timestamp = Date.now();
        
        lines.forEach((line, index) => {
            if (line < 0) return; // Skip invalid line numbers
            
            const content = contents[index].trim();
            if (content && !lineSet.has(line)) {
                lineSet.add(line);
                this.lineDetails.push({
                    filePath,
                    line,
                    content,
                    timestamp
                });
            }
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
    
    private refreshDecorations() {
        const updateService = UpdateService.getInstance();
        vscode.window.visibleTextEditors
            .filter(editor => editor.document.languageId === 'pawn')
            .forEach(editor => {
                updateService.updateAllDecorations(editor);
            });
    }
    
    public dispose() {
        this._onLinesChanged.dispose();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}