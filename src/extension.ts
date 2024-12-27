import * as vscode from 'vscode';
import { UpdateService } from './services/updateService';
import { WebviewProvider } from './providers/webviewProvider';
import { ColorProvider } from './providers/colorProvider';
import { ConfigurationLoader } from './configurations/configLoader';
import { DecorationManager } from './models/decorations';
import { COMMANDS } from './constants';
import { registerIgnoredLinesCommands } from './features/ignoredLines/ignoredLinesCommands';
import { IgnoredLinesManager } from './features/ignoredLines/ignoredLinesManager';


export async function activate(context: vscode.ExtensionContext) {
    const configLoader = ConfigurationLoader.getInstance();
    const updateService = UpdateService.getInstance();
    const colorProvider = new ColorProvider();
    
    await WebviewProvider.checkVersionAndShowSplash(context);

    updateService.initialize(context);

    registerIgnoredLinesCommands(context);

    const ignoredLinesManager = IgnoredLinesManager.getInstance(context);

    context.subscriptions.push(
        ignoredLinesManager.onLinesChanged(() => {
            vscode.window.visibleTextEditors.forEach(editor => {
                if (editor.document.languageId === 'pawn') {
                    const fullRange = new vscode.Range(
                        editor.document.positionAt(0),
                        editor.document.positionAt(editor.document.getText().length)
                    );
                    vscode.commands.executeCommand('editor.action.colorPresentation', editor.document.uri, fullRange);
                    
                    updateService.updateAllDecorations(editor);
                }
            });
        })
    );

    context.subscriptions.push(
        vscode.languages.registerColorProvider(
            { language: "pawn", scheme: "file" },
            colorProvider
        )
    );

    registerCommands(context, configLoader, updateService);
}

function registerCommands(
    context: vscode.ExtensionContext,
    configLoader: ConfigurationLoader,
    updateService: UpdateService
): void {
    context.subscriptions.push(
        updateService.registerCommand(
            COMMANDS.TOGGLE_HEX_COLOR,
            async () => {
                const config = configLoader.getConfig();
                await configLoader.updateConfig('hex', 'enabled', !config.hex.enabled);
                
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    updateService.updateAllDecorations(editor);
                }
                
                vscode.window.showInformationMessage(
                    `Hex Colour Highlighting ${config.hex.enabled ? 'enabled' : 'disabled'}`
                );
            }
        )
    );

    context.subscriptions.push(
        updateService.registerCommand(
            COMMANDS.TOGGLE_INLINE_COLORS,
            async () => {
                const config = configLoader.getConfig();
                await configLoader.updateConfig('inlineText', 'enabled', !config.inlineText.enabled);
                
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    updateService.updateAllDecorations(editor);
                }
                
                vscode.window.showInformationMessage(
                    `Inline Colour Highlighting ${config.inlineText.enabled ? 'enabled' : 'disabled'}`
                );
            }
        )
    );

    context.subscriptions.push(
        updateService.registerCommand(
            COMMANDS.TOGGLE_GAMETEXT_COLORS,
            async () => {
                const config = configLoader.getConfig();
                await configLoader.updateConfig('gameText', 'enabled', !config.gameText.enabled);
                
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    updateService.updateAllDecorations(editor);
                }
                
                vscode.window.showInformationMessage(
                    `GameText Colour Preview ${config.gameText.enabled ? 'enabled' : 'disabled'}`
                );
            }
        )
    );

    context.subscriptions.push(
        updateService.registerCommand(
            COMMANDS.TOGGLE_COLOR_PICKER,
            async () => {
                const config = configLoader.getConfig();
                await configLoader.updateConfig(
                    'general', 
                    'enableColourPicker', 
                    !config.general.enableColourPicker
                );
                
                vscode.window.showInformationMessage(
                    `Normal Colour Picker ${config.general.enableColourPicker ? 'enabled' : 'disabled'}`
                );
            }
        )
    );
}

export function deactivate() {
    const decorationManager = DecorationManager.getInstance();
    decorationManager.disposeAll();

    const updateService = UpdateService.getInstance();
    updateService.dispose();
}