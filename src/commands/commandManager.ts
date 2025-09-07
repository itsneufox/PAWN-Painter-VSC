import * as vscode from "vscode";
import { IgnoredLinesManager } from "../utils/ignoredLines";
import { getSetting } from "../utils/helpers";

export class CommandManager {
  private ignoredLinesManager: IgnoredLinesManager;

  constructor(
    private context: vscode.ExtensionContext,
    ignoredLinesManager: IgnoredLinesManager
  ) {
    this.ignoredLinesManager = ignoredLinesManager;
  }

  public registerCommands() {
    // Toggle commands
    this.registerCommand('pawn-painter.toggleHexColorHighlight', this.toggleHexColorHighlight.bind(this));
    this.registerCommand('pawn-painter.toggleGameTextColorPicker', this.toggleGameTextColorPicker.bind(this));
    this.registerCommand('pawn-painter.toggleNormalColorPicker', this.toggleNormalColorPicker.bind(this));

    // Ignored lines commands
    this.registerCommand('pawn-painter.ignoreLine', this.ignoreLine.bind(this));
    this.registerCommand('pawn-painter.unignoreLine', this.unignoreLine.bind(this));
    this.registerCommand('pawn-painter.ignoreFile', this.ignoreFile.bind(this));
    this.registerCommand('pawn-painter.unignoreFile', this.unignoreFile.bind(this));
    this.registerCommand('pawn-painter.clearIgnoredLines', this.clearIgnoredLines.bind(this));
    this.registerCommand('pawn-painter.showIgnoredLines', this.showIgnoredLines.bind(this));

    // Utility commands
    this.registerCommand('pawn-painter.resetGuideState', this.resetGuideState.bind(this));
  }

  private registerCommand(command: string, callback: (...args: any[]) => any) {
    const disposable = vscode.commands.registerCommand(command, callback);
    this.context.subscriptions.push(disposable);
  }

  private async toggleHexColorHighlight() {
    const config = vscode.workspace.getConfiguration('pawn-painter');
    const current = config.get<boolean>('hex.enabled', true);
    await config.update('hex.enabled', !current, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage(
      `Hex color highlighting ${!current ? 'enabled' : 'disabled'}`
    );
  }

  private async toggleGameTextColorPicker() {
    const config = vscode.workspace.getConfiguration('pawn-painter');
    const current = config.get<boolean>('gameText.enabled', true);
    await config.update('gameText.enabled', !current, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage(
      `GameText color preview ${!current ? 'enabled' : 'disabled'}`
    );
  }

  private async toggleNormalColorPicker() {
    const config = vscode.workspace.getConfiguration('pawn-painter');
    const current = config.get<boolean>('general.enableColorPicker', true);
    await config.update('general.enableColorPicker', !current, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage(
      `Color picker ${!current ? 'enabled' : 'disabled'}`
    );
  }

  private ignoreLine() {
    this.ignoredLinesManager.ignoreSelectedLines();
  }

  private unignoreLine() {
    this.ignoredLinesManager.unignoreSelectedLines();
  }

  private ignoreFile() {
    this.ignoredLinesManager.ignoreCurrentFile();
  }

  private unignoreFile() {
    this.ignoredLinesManager.unignoreCurrentFile();
  }

  private clearIgnoredLines() {
    vscode.window.showWarningMessage(
      'Clear all ignored lines?',
      'Yes',
      'No'
    ).then(choice => {
      if (choice === 'Yes') {
        this.ignoredLinesManager.clearAllIgnoredLines();
      }
    });
  }

  private showIgnoredLines() {
    this.ignoredLinesManager.showIgnoredLinesHistory();
  }

  private resetGuideState() {
    this.context.globalState.update('pawn-painter.guideShown', false);
    vscode.window.showInformationMessage('Guide state reset. Guide will show on next restart.');
  }

  public dispose() {
    // Commands are automatically disposed via context.subscriptions
  }
}
