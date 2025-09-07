import * as vscode from "vscode";
import { PawnColorTranslator } from "../colorTranslatorExtended";
import { parseColorString } from "../utils/helpers";

export class ContextMenuCommands {
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.registerCommands();
  }

  private registerCommands() {
    this.disposables.push(
      vscode.commands.registerCommand('pawn-painter.convertToHexWithAlpha', this.convertToHexWithAlpha.bind(this)),
      vscode.commands.registerCommand('pawn-painter.convertToHexNoAlpha', this.convertToHexNoAlpha.bind(this)),
      vscode.commands.registerCommand('pawn-painter.convertToBraced', this.convertToBraced.bind(this)),
      vscode.commands.registerCommand('pawn-painter.convertToRGB', this.convertToRGB.bind(this))
    );
  }

  private async convertColor(formatType: 'hexWithAlpha' | 'hexNoAlpha' | 'braced' | 'rgb') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select a colour to convert');
      return;
    }

    const selectedText = editor.document.getText(selection).trim();
    
    const vsColour = parseColorString(selectedText);
    if (!vsColour) {
      vscode.window.showErrorMessage(`"${selectedText}" is not a valid colour format`);
      return;
    }
    const pawnColour = new PawnColorTranslator({
      r: vsColour.red * 255,
      g: vsColour.green * 255,
      b: vsColour.blue * 255,
      alpha: vsColour.alpha
    });

    let convertedColour: string;
    switch (formatType) {
      case 'hexWithAlpha':
        convertedColour = pawnColour.pawnHex;
        break;
      case 'hexNoAlpha':
        convertedColour = pawnColour.pawnHexNoAlpha;
        break;
      case 'braced':
        convertedColour = pawnColour.pawnBraced;
        break;
      case 'rgb':
        convertedColour = pawnColour.pawnRgb;
        break;
      default:
        vscode.window.showErrorMessage('Unknown format type');
        return;
    }

    await editor.edit(editBuilder => {
      editBuilder.replace(selection, convertedColour);
    });

    vscode.window.showInformationMessage(`Converted "${selectedText}" to ${convertedColour}`);
  }

  private async convertToHexWithAlpha() {
    await this.convertColor('hexWithAlpha');
  }

  private async convertToHexNoAlpha() {
    await this.convertColor('hexNoAlpha');
  }

  private async convertToBraced() {
    await this.convertColor('braced');
  }

  private async convertToRGB() {
    await this.convertColor('rgb');
  }

  public dispose() {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
