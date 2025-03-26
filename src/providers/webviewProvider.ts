import * as vscode from 'vscode';

export class WebviewProvider {
    private static readonly VERSION_KEY = 'pawnpainter.lastVersion';

    private static parseVersion(version: string): { major: number; minor: number; patch: number } {
        const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number);
        return { major, minor, patch };
    }

    private static isSignificantUpdate(currentVersion: string, lastVersion: string): boolean {
        const current = this.parseVersion(currentVersion);
        const last = this.parseVersion(lastVersion);

        // Show notification for major or minor version changes
        return current.major > last.major || 
               (current.major === last.major && current.minor > last.minor);
    }

    public static async checkVersionAndShowNotification(
        context: vscode.ExtensionContext
    ): Promise<void> {
        const extension = vscode.extensions.getExtension('itsneufox.pawn-painter');
        if (!extension) {
            return;
        }

        const currentVersion = extension.packageJSON.version;
        const lastVersion = context.globalState.get<string>(WebviewProvider.VERSION_KEY);
        const isFirstInstall = !lastVersion;

        if (isFirstInstall || (lastVersion && this.isSignificantUpdate(currentVersion, lastVersion))) {
            await this.showUpdateNotification(currentVersion);
            await context.globalState.update(WebviewProvider.VERSION_KEY, currentVersion);
        }
    }

    private static async showUpdateNotification(version: string): Promise<void> {
        const result = await vscode.window.showInformationMessage(
            `PAWN Painter has been updated to v${version} with new features. Check it out!`,
            'View on GitHub',
            'Visit Website'
        );

        if (result === 'View on GitHub') {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/itsneufox/PAWN-Painter-VSC'));
        } else if (result === 'Visit Website') {
            // Replace with your actual website URL
            vscode.env.openExternal(vscode.Uri.parse('https://itsneufox.xyz/#/pawnpainter'));
        }
    }
}