import * as vscode from 'vscode';
import * as path from 'path';

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
            await this.showSplashScreen(context, currentVersion);
            await context.globalState.update(this.VERSION_KEY, currentVersion);
        }
    }
    private static readonly SPLASH_SCREEN_TIMEOUT = 30000;

    public static async showSplashScreen(
        context: vscode.ExtensionContext,
        version: string
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

        panel.webview.html = this.getWebviewHtml(panel.webview, context.extensionUri, version);

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
        version: string
    ): string {
        const logoPath = vscode.Uri.joinPath(extensionUri, 'images', 'repository-logo.png');
        const logoUri = webview.asWebviewUri(logoPath);

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:;">
                <title>PAWN Painter</title>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${logoUri}" alt="PAWN Painter" class="logo">
                        <p class="version">Version ${version}</p>
                    </div>
                    
                    <div class="content">
                        <div class="features">
                            <h2>Key Features</h2>
                            <ul>
                                <li>
                                    <span class="feature-dot blue"></span>
                                    Real-time colour highlighting for hex codes and RGB values
                                </li>
                                <li>
                                    <span class="feature-dot green"></span>
                                    Gametext colour previews with support for colour intensities
                                </li>
                                <li>
                                    <span class="feature-dot purple"></span>
                                    Built-in colour picker for easy colour selection
                                </li>
                                <li>
                                    <span class="feature-dot orange"></span>
                                    Customizable highlighting styles
                                </li>
                            </ul>
                        </div>

                        <div class="changelog-grid">
                            <div class="changelog-box">
                                <h3>What's New</h3>
                                <ul>
                                    <li>
                                        <span class="feature-dot blue"></span>
                                        Better colour detection in functions
                                    </li>
                                    <li>
                                        <span class="feature-dot blue"></span>
                                        Improved TextDraw function support
                                    </li>
                                    <li>
                                        <span class="feature-dot blue"></span>
                                        Fixed decimal number detection
                                    </li>
                                    <li>
                                        <span class="feature-dot blue"></span>
                                        Smarter context-aware coloring
                                    </li>
                                </ul>
                            </div>

                            <div class="changelog-box">
                                <h3>Bug Fixes</h3>
                                <ul>
                                    <li>
                                        <span class="feature-dot orange"></span>
                                        Fixed decimal number highlighting
                                    </li>
                                    <li>
                                        <span class="feature-dot orange"></span>
                                        Improved color detection accuracy
                                    </li>
                                    <li>
                                        <span class="feature-dot orange"></span>
                                        Fixed alpha value handling
                                    </li>
                                    <li>
                                        <span class="feature-dot orange"></span>
                                        Better RGB value validation
                                    </li>
                                </ul>
                            </div>

                            <div class="changelog-box">
                                <h3>Improvements</h3>
                                <ul>
                                    <li>
                                        <span class="feature-dot green"></span>
                                        Enhanced color detection accuracy
                                    </li>
                                    <li>
                                        <span class="feature-dot green"></span>
                                        Better format handling
                                    </li>
                                    <li>
                                        <span class="feature-dot green"></span>
                                        Improved color validation
                                    </li>
                                    <li>
                                        <span class="feature-dot green"></span>
                                        Broader color support
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <button onclick="vscode.postMessage({type: 'close'})">Let's Paint Some Code!</button>
                        <p class="auto-close-text">or wait 30 seconds for this window to close automatically</p>
                    </div>
                </div>

                <style>
                    body {
                        padding: 20px;
                        color: var(--vscode-foreground);
                        font-family: var(--vscode-font-family);
                        background-color: var(--vscode-editor-background);
                    }

                    .container {
                        max-width: 1000px;
                        margin: 0 auto;
                    }

                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }

                    .logo {
                        width: 100%;
                        max-width: 800px;
                        height: auto;
                        margin-bottom: 20px;
                    }

                    .version {
                        color: var(--vscode-textPreformat-foreground);
                        font-size: 14px;
                        margin-top: 10px;
                    }

                    .features h2 {
                        color: var(--vscode-textLink-foreground);
                        font-size: 18px;
                        margin-bottom: 15px;
                    }

                    .feature-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        margin-right: 10px;
                        margin-top: 6px;
                        flex-shrink: 0;
                    }

                    .blue { background-color: #007acc; }
                    .green { background-color: #28a745; }
                    .purple { background-color: #6f42c1; }
                    .orange { background-color: #f66a0a; }

                    .changelog-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 20px;
                        margin-top: 30px;
                    }

                    .changelog-box {
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 6px;
                        padding: 15px;
                    }

                    .changelog-box h3 {
                        color: var(--vscode-textLink-foreground);
                        font-size: 16px;
                        margin-bottom: 15px;
                        margin-top: 0;
                    }

                    .changelog-box ul {
                        margin: 0;
                        padding: 0;
                        list-style: none;
                    }

                    .changelog-box li {
                        display: flex;
                        align-items: flex-start;
                        margin-bottom: 12px;
                        line-height: 1.4;
                    }

                    .footer {
                        text-align: center;
                        margin-top: 30px;
                    }

                    button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    }

                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }

                    .auto-close-text {
                        margin-top: 10px;
                        color: var(--vscode-descriptionForeground);
                        font-size: 12px;
                        opacity: 0.8;
                    }
                </style>
                <script>
                    const vscode = acquireVsCodeApi();
                </script>
            </body>
                            </html>`;
                }
            }