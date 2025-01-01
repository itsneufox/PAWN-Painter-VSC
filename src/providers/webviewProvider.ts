import * as vscode from 'vscode';

export class WebviewProvider {
    private static readonly VERSION_KEY = 'pawnpainter.lastVersion';

    public static async checkVersionAndShowSplash(
        context: vscode.ExtensionContext
    ): Promise<void> {
        const extension = vscode.extensions.getExtension('itsneufox.pawn-painter');
        if (!extension) {
            return;
        }

        const currentVersion = extension.packageJSON.version;
        const lastVersion = context.globalState.get(this.VERSION_KEY);
        const isFirstInstall = !lastVersion;

        if (isFirstInstall || currentVersion !== lastVersion) {
            await this.showSplashScreen(context);
            await context.globalState.update(this.VERSION_KEY, currentVersion);
        }
    }
    private static readonly SPLASH_SCREEN_TIMEOUT = 60000;

    public static async showSplashScreen(
        context: vscode.ExtensionContext,
    ): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'pawnPainterSplash',
            'PAWN Painter',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [context.extensionUri]
            }
        );

        panel.webview.html = this.getWebviewHtml(panel.webview, context.extensionUri);

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'close':
                        panel.dispose();
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        let isDisposed = false;
        setTimeout(() => {
            if (!isDisposed) {
                panel.dispose();
            }
        }, this.SPLASH_SCREEN_TIMEOUT);

        panel.onDidDispose(() => {
            isDisposed = true;
        }, null, context.subscriptions);
    }

    private static getWebviewHtml(
        webview: vscode.Webview,
        extensionUri: vscode.Uri,
    ): string {
        const logoPath = vscode.Uri.joinPath(extensionUri, 'images', 'repository-logo.png');
        const logoUri = webview.asWebviewUri(logoPath);

        return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:;">
        <title>PAWN Painter</title>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${logoUri}" alt="PAWN Painter" class="logo">
            </div>
            
            <div class="hero">
                <h1>Welcome to the New <span class="rainbow-text">PAWN</span> Painter</h1>
                <p class="subtitle">Completely rewritten from the ground up</p>
            </div>

            <div class="content">
                <div class="grid">
                    <div class="update-box rewrite">
                        <div class="box-header">
                            <div class="header-line"></div>
                            <h2>Complete Rewrite</h2>
                        </div>
                        <ul>
                            <li><span class="highlight purple">Modern</span> TypeScript codebase</li>
                            <li><span class="highlight purple">Enhanced</span> performance & stability</li>
                            <li><span class="highlight purple">Improved</span> error handling</li>
                            <li><span class="highlight purple">Better</span> code organization</li>
                        </ul>
                    </div>

                    <div class="update-box features">
                        <div class="box-header">
                            <div class="header-line"></div>
                            <h2>New Features</h2>
                        </div>
                        <ul>
                            <li><span class="highlight blue">Ignore</span> specific color highlights</li>
                            <li><span class="highlight blue">History</span> with line preview</li>
                            <li><span class="highlight blue">Restore</span> ignored colors easily</li>
                            <li><span class="highlight blue">Multi-line</span> color ignore support</li>
                        </ul>
                    </div>

                    <div class="update-box improvements">
                        <div class="box-header">
                            <div class="header-line"></div>
                            <h2>Improvements</h2>
                        </div>
                        <ul>
                            <li><span class="highlight green">Smarter</span> color detection</li>
                            <li><span class="highlight green">Enhanced</span> TextDraw support</li>
                            <li><span class="highlight green">Optimized</span> performance</li>
                            <li><span class="highlight green">Better</span> context handling</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="footer">
                <button id="closeButton" class="cta-button">Let's Paint Some Code!</button>
                <p class="auto-close">This window will close automatically in 60 seconds</p>
            </div>
        </div>

        <style>
            body {
                margin: 0;
                padding: 0;
                color: var(--vscode-foreground);
                font-family: var(--vscode-font-family);
                background-color: var(--vscode-editor-background);
                line-height: 1.6;
            }

            .container {
                max-width: 1000px;
                margin: 0 auto;
                padding: 2rem;
            }

            .header {
                text-align: center;
                position: relative;
                margin-bottom: 2rem;
            }

            .logo {
                width: 100%;
                max-width: 600px;
                height: auto;
                display: block;
                margin: 0 auto;
                margin-bottom: 1.5rem;
            }

            .hero {
                text-align: center;
                margin-bottom: 3rem;
            }

            .hero h1 {
                font-size: 2.2rem;
                color: var(--vscode-textLink-foreground);
                margin: 0;
                margin-bottom: 0.5rem;
            }

            .subtitle {
                font-size: 1.2rem;
                color: var(--vscode-descriptionForeground);
                margin: 0;
            }

            .grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1.5rem;
                margin-bottom: 3rem;
            }

            .update-box {
                background-color: var(--vscode-editor-background);
                border: 1px solid var(--vscode-widget-border);
                border-radius: 8px;
                padding: 1.5rem;
                transition: transform 0.2s ease;
            }

            .update-box:hover {
                transform: translateY(-3px);
            }

            .box-header {
                margin-bottom: 1.5rem;
                position: relative;
            }

            .header-line {
                position: absolute;
                top: 0;
                left: -1.5rem;
                width: 4px;
                height: 100%;
                border-radius: 2px;
            }

            .rewrite .header-line {
                background-color: #6f42c1;
            }

            .features .header-line {
                background-color: #007acc;
            }

            .improvements .header-line {
                background-color: #28a745;
            }

            .box-header h2 {
                margin: 0;
                font-size: 1.3rem;
                color: var(--vscode-textLink-foreground);
                padding-left: 0.5rem;
            }

            .update-box ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .update-box li {
                margin-bottom: 0.8rem;
                display: flex;
                align-items: center;
                position: relative;
                padding-left: 0.5rem;
            }

            .highlight {
                font-weight: bold;
                margin-right: 0.3rem;
            }

            .purple { color: #6f42c1; }
            .blue { color: #007acc; }
            .green { color: #28a745; }

            .footer {
                text-align: center;
            }

            .cta-button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 0.8rem 1.8rem;
                border-radius: 4px;
                font-size: 1rem;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }

            .cta-button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            .auto-close {
                margin-top: 1rem;
                color: var(--vscode-descriptionForeground);
                font-size: 0.9rem;
                opacity: 0.8;
            }

            @media (max-width: 800px) {
                .grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .hero h1 {
                    font-size: 1.8rem;
                }

                .container {
                    padding: 1rem;
                }
            }
            .rainbow-text {
                background-image: linear-gradient(
                    90deg,
                    #ff0000 0%,
                    #ff9a00 16%,
                    #d0de21 32%,
                    #4fdc4a 48%,
                    #3fdad8 64%,
                    #2fc9e2 80%,
                    #9b4cff 90%,
                    #ff6b97 95%,
                    #ff0000 100%
                );
                background-size: 200% auto;
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: shine 3s linear infinite;
            }

            @keyframes shine {
                to {
                    background-position: 200% center;
                }
            }
        </style>

        <script>
            const vscode = acquireVsCodeApi();
            
            document.getElementById('closeButton').addEventListener('click', () => {
                vscode.postMessage({ type: 'close' });
            });
        </script>
    </body>
    </html>`;
    }
}