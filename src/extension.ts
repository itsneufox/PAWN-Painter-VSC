import * as vscode from "vscode";
import { getCustomMatches, getMatches, getGameTextMatches } from "./getMatches";
import { isValidDocument } from "./utils/helpers";
import { PawnColorTranslator } from "./colorTranslatorExtended";
import { GameTextProvider } from "./providers/gameTextProvider";
import { AlphaWarningsManager } from "./utils/alphaWarnings";
import { ContextMenuCommands } from "./commands/contextMenuCommands";
import { IgnoredLinesManager } from "./utils/ignoredLines";
import { CommandManager } from "./commands/commandManager";
class PawnPicker implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private gameTextProvider: GameTextProvider;
  private alphaWarningsManager: AlphaWarningsManager;
  private contextMenuCommands: ContextMenuCommands;
  private ignoredLinesManager: IgnoredLinesManager;
  private commandManager: CommandManager;

  constructor(private context: vscode.ExtensionContext) {
    this.ignoredLinesManager = new IgnoredLinesManager(context);
    this.gameTextProvider = new GameTextProvider(this.ignoredLinesManager);
    this.alphaWarningsManager = new AlphaWarningsManager();
    this.contextMenuCommands = new ContextMenuCommands();
    this.commandManager = new CommandManager(context, this.ignoredLinesManager);
    this.commandManager.registerCommands();
    this.register();
  }

  private register() {
    let disabled = false;
    const self = this;
    
    this.disposables.push(vscode.languages.registerColorProvider(
      [
        { scheme: 'file', language: 'pawn' },
        { scheme: 'file', pattern: '**/*.pwn' },
        { scheme: 'file', pattern: '**/*.inc' },
        { scheme: 'file', pattern: '**/*.p' },
        { scheme: 'file', pattern: '**/*.pawno' },
      ],
      {
      provideDocumentColors: async (document: vscode.TextDocument) => {
        if (disabled) {
          disabled = false;
          return;
        }
        
        if (vscode.workspace.getConfiguration('pawn-painter').get<boolean>('disable', false)) {
          return;
        }

        if (!vscode.workspace.getConfiguration('pawn-painter').get<boolean>('general.enableColorPicker', true)) {
          return;
        }

        if (!isValidDocument(document)) return;

        const text = document.getText();

        let matches = [
          ...(await getMatches(text)),
          ...getCustomMatches(text, document.languageId),
        ];

        if (self.ignoredLinesManager) {
          matches = matches.filter(match => {
            const line = match.range.start.line;
            return !self.ignoredLinesManager.isLineIgnored(document, line);
          });
        }

        return matches;
      },

      provideColorPresentations(colorRaw, { range, document }) {
        if (!isValidDocument(document)) return;
        
        if (!vscode.workspace.getConfiguration('pawn-painter').get<boolean>('general.enableColorPicker', true)) {
          return;
        }

        const { red: r, green: g, blue: b, alpha } = colorRaw;
        const color = new PawnColorTranslator({
          r: r * 255,
          g: g * 255,
          b: b * 255,
          alpha,
        });

        const representations = [
          color.pawnHex,
          color.pawnHexNoAlpha,
          color.pawnBraced,
          color.pawnDecimal,
          color.pawnRgb,
        ];

        return representations.map(
          (representation) => new vscode.ColorPresentation(representation)
        );
      },
    }));

    if (vscode.window.activeTextEditor && this.isPawnFile(vscode.window.activeTextEditor.document)) {
      this.gameTextProvider.updateDecorations(vscode.window.activeTextEditor);
      this.alphaWarningsManager.updateAlphaWarnings(vscode.window.activeTextEditor);
    }
  }

  private isPawnFile(document: vscode.TextDocument): boolean {
    return document.languageId === 'pawn' || 
           ['.pwn', '.inc', '.p', '.pawno'].some(ext => document.fileName.endsWith(ext));
  }

  public dispose() {
    this.gameTextProvider?.dispose();
    this.alphaWarningsManager?.dispose();
    this.contextMenuCommands?.dispose();
    this.ignoredLinesManager?.dispose();
    this.commandManager?.dispose();
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];
  }
}

export function activate(context: vscode.ExtensionContext) {
  const picker = new PawnPicker(context);
  context.subscriptions.push(picker);
}
