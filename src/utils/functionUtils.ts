import * as vscode from 'vscode';

export class FunctionUtils {
    public isWithinFunctionCall(document: vscode.TextDocument, position: vscode.Position): boolean {
        const line = document.lineAt(position.line).text;
        const lineUntilPosition = line.substring(0, position.character);

        let openParens = 0;
        for (const char of lineUntilPosition) {
            if (char === '(') openParens++;
            if (char === ')') openParens--;
        }

        if (openParens > 0) {
            const functionCallRegex = /\b[A-Za-z_][A-Za-z0-9_]*\s*\(/;
            return functionCallRegex.test(lineUntilPosition);
        }

        return false;
    }

    public getFunctionNameAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): string | undefined {
        const line = document.lineAt(position.line).text;
        const lineUntilPosition = line.substring(0, position.character);

        const functionMatch = lineUntilPosition.match(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\([^(]*$/);
        return functionMatch ? functionMatch[1] : undefined;
    }

    public isWithinFunctionType(
        document: vscode.TextDocument,
        position: vscode.Position,
        functionPattern: RegExp,
    ): boolean {
        const functionName = this.getFunctionNameAtPosition(document, position);
        return functionName ? functionPattern.test(functionName) : false;
    }

    public getFunctionParameters(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): string[] {
        const line = document.lineAt(position.line).text;
        const lineUntilPosition = line.substring(0, position.character);

        const lastOpenParen = lineUntilPosition.lastIndexOf('(');
        if (lastOpenParen === -1) return [];

        const params = [];
        let currentParam = '';
        let parenCount = 0;

        for (let i = lastOpenParen + 1; i < position.character; i++) {
            const char = line[i];

            if (char === '(') {
                parenCount++;
                currentParam += char;
            } else if (char === ')') {
                parenCount--;
                if (parenCount < 0) break;
                currentParam += char;
            } else if (char === ',' && parenCount === 0) {
                params.push(currentParam.trim());
                currentParam = '';
            } else {
                currentParam += char;
            }
        }

        if (currentParam) {
            params.push(currentParam.trim());
        }

        return params;
    }

    public getCurrentParameterIndex(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): number {
        const parameters = this.getFunctionParameters(document, position);
        if (!parameters.length) return 0;

        const line = document.lineAt(position.line).text;
        const lineUntilPosition = line.substring(0, position.character);
        let commaCount = 0;
        let parenCount = 0;

        for (const char of lineUntilPosition) {
            if (char === '(') parenCount++;
            if (char === ')') parenCount--;
            if (char === ',' && parenCount === 1) commaCount++;
        }

        return commaCount;
    }
}
