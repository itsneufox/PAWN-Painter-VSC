import * as vscode from 'vscode';
import { UpdateService } from './services/updateService';
import { WebviewProvider } from './providers/webviewProvider';
import { ColorProvider } from './providers/colorProvider';
import { ConfigurationLoader } from './configurations/configLoader';
import { DecorationManager } from './models/decorations';
import { COMMANDS } from './constants';
import { registerIgnoredLinesCommands } from './features/ignoredLines/ignoredLinesCommands';
import { IgnoredLinesManager } from './features/ignoredLines/ignoredLinesManager';
import { ColorConverter } from './utils/colorConverter';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const configLoader = ConfigurationLoader.getInstance();
    const updateService = UpdateService.getInstance();
    const colorProvider = new ColorProvider();
    await WebviewProvider.checkVersionAndShowNotification(context);
    updateService.initialize(context);
    registerIgnoredLinesCommands(context);

    context.subscriptions.push(
        vscode.languages.registerColorProvider(
            [
                { scheme: 'file', language: 'pawn' },
                { scheme: 'file', pattern: '**/*.pwn' },
                { scheme: 'file', pattern: '**/*.inc' },
                { scheme: 'file', pattern: '**/*.p' },
                { scheme: 'file', pattern: '**/*.pawno' },
            ],
            colorProvider,
        ),
    );

    const config = configLoader.getConfig();
    await vscode.workspace
        .getConfiguration('editor', null)
        .update(
            'colorDecorators',
            config.general.enableColourPicker,
            vscode.ConfigurationTarget.Global,
        );

    if (vscode.window.activeTextEditor) {
        updateService.updateAllDecorations(vscode.window.activeTextEditor);
    }

    const ignoredLinesManager = IgnoredLinesManager.getInstance(context);
    context.subscriptions.push(
        ignoredLinesManager.onLinesChanged(() => {
            vscode.window.visibleTextEditors
                .filter((editor) => editor.document.languageId === 'pawn')
                .forEach((editor) => {
                    updateService.updateAllDecorations(editor);
                });
        }),
    );

    registerCommands(context, configLoader, updateService);
}

function registerColorDisplayCommand(
    context: vscode.ExtensionContext,
    commandId: string,
    format: string,
): void {
    context.subscriptions.push(
        vscode.commands.registerCommand(commandId, async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const selection = editor.selection;
            const selectedText = editor.document.getText(selection).trim();

            const colorConverter = new ColorConverter();
            let result: string;

            const detectedFormat = colorConverter.detectColorFormat(selectedText);

            try {
                if (detectedFormat === 'DECIMAL' || /^-?\d+$/.test(selectedText)) {
                    const numValue = parseInt(selectedText, 10);
                    result = colorConverter.formatColor(numValue, format);
                } else {
                    result = colorConverter.formatColor(selectedText, format);
                }

                await editor.edit((editBuilder) => {
                    editBuilder.replace(selection, result);
                });
            } catch (error) {
                vscode.window.showErrorMessage(
                    'Unable to display the color in the requested format.',
                );
                console.error('Color display error:', error);
            }
        }),
    );
}

function registerCommands(
    context: vscode.ExtensionContext,
    configLoader: ConfigurationLoader,
    updateService: UpdateService,
): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('pawnpainter.resetGuideState', async () => {
            await context.globalState.update('pawnpainter.lastVersion', undefined);
            vscode.window.showInformationMessage(
                'PAWN Painter notification will be shown on next restart.',
            );
        }),
    );

    context.subscriptions.push(
        updateService.registerCommand(COMMANDS.TOGGLE_HEX_COLOR, async () => {
            const config = configLoader.getConfig();
            await configLoader.updateConfig('hex', 'enabled', !config.hex.enabled);

            const editor = vscode.window.activeTextEditor;
            if (editor) {
                updateService.updateAllDecorations(editor);
            }

            vscode.window.showInformationMessage(
                `Hex Colour Highlighting ${config.hex.enabled ? 'enabled' : 'disabled'}`,
            );
        }),
    );

    context.subscriptions.push(
        updateService.registerCommand(COMMANDS.TOGGLE_GAMETEXT_COLORS, async () => {
            const config = configLoader.getConfig();
            await configLoader.updateConfig('gameText', 'enabled', !config.gameText.enabled);

            const editor = vscode.window.activeTextEditor;
            if (editor) {
                updateService.updateAllDecorations(editor);
            }

            vscode.window.showInformationMessage(
                `GameText Colour Preview ${config.gameText.enabled ? 'enabled' : 'disabled'}`,
            );
        }),
    );

    context.subscriptions.push(
        updateService.registerCommand(COMMANDS.TOGGLE_COLOR_PICKER, async () => {
            const config = configLoader.getConfig();
            const newValue = !config.general.enableColourPicker;
            await configLoader.updateConfig('general', 'enableColourPicker', newValue);

            await vscode.workspace
                .getConfiguration('editor', null)
                .update('colorDecorators', newValue, vscode.ConfigurationTarget.Global);

            if (vscode.window.activeTextEditor) {
                vscode.commands.executeCommand('editor.action.triggerSuggest');
                setTimeout(() => {
                    vscode.commands.executeCommand('editor.action.cancelSuggest');
                }, 100);
            }

            vscode.window.showInformationMessage(
                `VS Code Colour Picker ${newValue ? 'enabled' : 'disabled'}`,
            );
        }),
    );

    context.subscriptions.push(
        updateService.registerCommand(COMMANDS.TOGGLE_INLINE_CODE_COLORS, async () => {
            const config = configLoader.getConfig();
            await configLoader.updateConfig(
                'inlineText',
                'codeEnabled',
                !config.inlineText.codeEnabled,
            );

            const editor = vscode.window.activeTextEditor;
            if (editor) {
                updateService.updateAllDecorations(editor);
            }

            vscode.window.showInformationMessage(
                `Inline Code Colour Highlighting ${config.inlineText.codeEnabled ? 'enabled' : 'disabled'}`,
            );
        }),
    );

    context.subscriptions.push(
        updateService.registerCommand(COMMANDS.TOGGLE_INLINE_TEXT_COLORS, async () => {
            const config = configLoader.getConfig();
            await configLoader.updateConfig(
                'inlineText',
                'textEnabled',
                !config.inlineText.textEnabled,
            );

            const editor = vscode.window.activeTextEditor;
            if (editor) {
                updateService.updateAllDecorations(editor);
            }

            vscode.window.showInformationMessage(
                `Inline Text Colour Highlighting ${config.inlineText.textEnabled ? 'enabled' : 'disabled'}`,
            );
        }),
    );

    registerColorDisplayCommand(context, 'pawnpainter.displayAsHexColorWithAlpha', '0xRRGGBBAA');
    registerColorDisplayCommand(context, 'pawnpainter.displayAsHexColorNoAlpha', '0xRRGGBB');
    registerColorDisplayCommand(context, 'pawnpainter.displayAsBracedColor', '{RRGGBB}');
    registerColorDisplayCommand(context, 'pawnpainter.displayAsDecimal', 'DECIMAL');

    context.subscriptions.push(
        vscode.commands.registerCommand('pawnpainter.displayAsHexColor', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const selection = editor.selection;
            const selectedText = editor.document.getText(selection).trim();

            const colorConverter = new ColorConverter();

            const formatChoice = await vscode.window.showQuickPick(
                [
                    { label: '0xRRGGBBAA', description: 'Standard hex format with alpha' },
                    { label: '0xRRGGBB', description: 'Standard hex format without alpha' },
                    { label: '{RRGGBB}', description: 'Braced format for text coloring' },
                    { label: 'DECIMAL', description: 'Decimal number format' },
                    { label: 'RGB', description: 'RGB format (r, g, b)' },
                ],
                {
                    placeHolder: 'Select color format to display as',
                },
            );

            if (!formatChoice) return;

            try {
                const detectedFormat = colorConverter.detectColorFormat(selectedText);
                let result: string;

                if (detectedFormat === 'DECIMAL' || /^-?\d+$/.test(selectedText)) {
                    const numValue = parseInt(selectedText, 10);
                    result = colorConverter.formatColor(numValue, formatChoice.label);
                } else {
                    result = colorConverter.formatColor(selectedText, formatChoice.label);
                }

                await editor.edit((editBuilder) => {
                    editBuilder.replace(selection, result);
                });
            } catch (error) {
                vscode.window.showErrorMessage(
                    'Unable to display the color in the requested format.',
                );
                console.error('Color display error:', error);
            }
        }),
    );
}

export function deactivate(): void {
    const decorationManager = DecorationManager.getInstance();
    decorationManager.disposeAll();

    const updateService = UpdateService.getInstance();
    updateService.dispose();
}
