import * as vscode from 'vscode';
import { DecorationManagerService } from './decorationManager';
import { ConfigurationLoader } from '../configurations/configLoader';

export class UpdateService {
    private static instance: UpdateService;
    private decorationService: DecorationManagerService;
    private configLoader: ConfigurationLoader;
    private disposables: vscode.Disposable[] = [];

    private constructor() {
        this.decorationService = new DecorationManagerService();
        this.configLoader = ConfigurationLoader.getInstance();
    }

    public static getInstance(): UpdateService {
        if (!UpdateService.instance) {
            UpdateService.instance = new UpdateService();
        }
        return UpdateService.instance;
    }

    public initialize(context: vscode.ExtensionContext): void {
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor) {
                    this.updateAllDecorations(editor);
                }
            }),

            vscode.workspace.onDidChangeTextDocument((event) => {
                const editor = vscode.window.activeTextEditor;
                if (editor && event.document === editor.document) {
                    this.updateAllDecorations(editor);
                }
            }),

            vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
                if (event.textEditor) {
                    this.updateAllDecorations(event.textEditor);
                }
            }),

            vscode.workspace.onDidChangeConfiguration((e) => {
                if (this.isRelevantConfigurationChange(e)) {
                    this.handleConfigurationChange();
                }
            }),
        );

        context.subscriptions.push(...this.disposables);

        if (vscode.window.activeTextEditor) {
            this.updateAllDecorations(vscode.window.activeTextEditor);
        }
    }

    private updateTimeout: NodeJS.Timeout | undefined;
    private lastUpdateTime: number = 0;
    private readonly MIN_UPDATE_INTERVAL = 150;

    public updateAllDecorations(editor: vscode.TextEditor): void {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }

        const now = Date.now();
        const timeSinceLastUpdate = now - this.lastUpdateTime;

        if (timeSinceLastUpdate < this.MIN_UPDATE_INTERVAL) {
            this.updateTimeout = setTimeout(() => {
                this.performUpdate(editor);
                this.lastUpdateTime = Date.now();
            }, this.MIN_UPDATE_INTERVAL - timeSinceLastUpdate);
        } else {
            this.performUpdate(editor);
            this.lastUpdateTime = now;
        }
    }

    private performUpdate(editor: vscode.TextEditor): void {
        try {
            this.decorationService.updateGameTextDecorations(editor);
            this.decorationService.updateHexColorDecorations(editor);
            this.decorationService.updateInlineColorDecorations(editor);
        } catch (error) {
            console.error('Error updating decorations:', error);
        }
    }

    private isRelevantConfigurationChange(e: vscode.ConfigurationChangeEvent): boolean {
        const relevantSettings = [
            'general.enableColourPicker',
            'hex.enabled',
            'hex.style',
            'hex.showAlphaWarnings',
            'gameText.enabled',
            'gameText.style',
            'inlineText.codeEnabled',
            'inlineText.textEnabled',
            'inlineText.codeStyle',
            'inlineText.textStyle',
        ];

        return relevantSettings.some((setting) => e.affectsConfiguration(`pawnpainter.${setting}`));
    }

    private handleConfigurationChange(): void {
        const previousConfig = { ...this.configLoader.getConfig() };

        this.configLoader.loadConfiguration();
        const newConfig = this.configLoader.getConfig();

        if (previousConfig.general.enableColourPicker !== newConfig.general.enableColourPicker) {
            vscode.workspace
                .getConfiguration('editor', null)
                .update(
                    'colorDecorators',
                    newConfig.general.enableColourPicker,
                    vscode.ConfigurationTarget.Global,
                );
        }

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            this.updateAllDecorations(editor);
        }
    }

    public registerCommand(
        command: string,
        callback: (...args: unknown[]) => unknown,
    ): vscode.Disposable {
        const disposable = vscode.commands.registerCommand(command, callback);
        this.disposables.push(disposable);
        return disposable;
    }

    public dispose(): void {
        this.disposables.forEach((d) => d.dispose());
        this.disposables = [];
    }
}
