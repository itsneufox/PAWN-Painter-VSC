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

        // Show splash screen only for major or minor version changes
        return current.major > last.major || 
               (current.major === last.major && current.minor > last.minor);
    }

    public static async checkVersionAndShowSplash(
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
            await this.showSplashScreen(context);
            await context.globalState.update(WebviewProvider.VERSION_KEY, currentVersion);
        }
    }

    private static readonly SPLASH_SCREEN_TIMEOUT = 300000; // 5 minutes timeout

    public static async showSplashScreen(
        context: vscode.ExtensionContext,
    ): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'pawnPainterSplash',
            'PAWN Painter Guide',
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
        _extensionUri: vscode.Uri,
    ): string {
        return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:;">
        <title>PAWN Painter Guide</title>
    </head>
    <body>
        <div class="container">
            <div class="hero">
                <h1>Welcome to <span class="rainbow-text">PAWN</span> Painter</h1>
                <p class="subtitle">Comprehensive Colour Highlighting for PAWN</p>
            </div>
    
            <div class="tabs">
                <button class="tab-button active" onclick="openTab('overview')">Overview</button>
                <button class="tab-button" onclick="openTab('hexColors')">Hex Colours</button>
                <button class="tab-button" onclick="openTab('gameText')">GameText</button>
                <button class="tab-button" onclick="openTab('inlineColors')">Inline Colours</button>
                <button class="tab-button" onclick="openTab('ignoreLines')">Ignoring Lines</button>
                <button class="tab-button" onclick="openTab('settings')">Settings</button>
            </div>
            <div class="tab-content">
                <div id="overview" class="tab-pane active">
                    <h2 style="text-align: center; border: none;">PAWN Painter improves your open.mp development with real-time colour previews in PAWN code.</h2>
                    <h3 style="text-align: center; border: none;">Use the tabs above to explore the extension or click "Let's paint some code!" at the bottom of the page<br /></h3>
                    <div class="feature-grid">
                        <div class="feature-card">
                            <div class="feature-icon">🎨</div>
                            <div class="feature-content">
                                <h3>Multiple Colour Formats</h3>
                                <p>Supports hex colours (0xRRGGBB, 0xRRGGBBAA), braced colours ({RRGGBB}), and RGB/RGBA formats.</p>
                            </div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">💬</div>
                            <div class="feature-content">
                                <h3>GameText Preview</h3>
                                <p>See accurate previews of ~r~, ~g~, ~b~ and other open.mp GameText colour codes.</p>
                            </div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📝</div>
                            <div class="feature-content">
                                <h3>Inline Text Colouring</h3>
                                <p>Preview colours in string format like: "{FF0000}Red Text"</p>
                            </div>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🔍</div>
                            <div class="feature-content">
                                <h3>Selective Highlighting</h3>
                                <p>Ignore specific lines from colour highlighting when needed.</p>
                            </div>
                        </div>
                    </div>
                </div>
    
                <div id="hexColors" class="tab-pane">
    <h2>Hex Colours</h2>
    <p>PAWN Painter highlights hex colour codes in your code, making it easy to visualize colours directly in your editor.</p>

    <div class="section">
        <h3>Supported Formats</h3>
        <div class="code-example">
            <pre><code>#define COLOUR_RED       <span class="color-preview" style="text-decoration: underline; text-decoration-color: #FF0000;">0xFF0000FF</span>
#define COLOUR_GREEN     <span class="color-preview" style="text-decoration: underline; text-decoration-color: #00FF00;">0x00FF00FF</span>
#define COLOUR_BLUE      <span class="color-preview" style="text-decoration: underline; text-decoration-color: #0000FF;">0x0000FFFF</span></code></pre>
        </div>
    </div>
    <div class="hex-features-container">
        <div class="section hex-features-left">
            <h3>Features:</h3>
            <ul class="feature-list">
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>Colour Highlighting</strong>
                    </div>
                    <div class="feature-description">
                        See colours directly in your code
                    </div>
                </li>
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>Alpha Support</strong>
                    </div>
                    <div class="feature-description">
                        Full support for RGBA colours (0xRRGGBBAA)
                    </div>
                </li>
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>Alpha Warnings</strong>
                    </div>
                    <div class="feature-description">
                        Optional warnings for colours with 00 alpha
                    </div>
                </li>
            </ul>
        </div>
        <div class="section hex-features-right">
            <h3>Styles that can be used:</h3>
            <div class="visualization-examples">
                <div class="vis-example">
                    <div class="vis-title">Text Colour</div>
                    <div class="vis-code-block">
                        <code>#define COLOUR_RED <span style="color: #FF0000;">0xFF0000FF</span></code>
                    </div>
                </div>
                <div class="vis-example">
                    <div class="vis-title">Underline</div>
                    <div class="vis-code-block">
                        <code>#define COLOUR_GREEN <span style="text-decoration: underline; text-decoration-color: #00FF00;">0x00FF00FF</span></code>
                    </div>
                </div>
                <div class="vis-example">
                    <div class="vis-title">Background</div>
                    <div class="vis-code-block">
                        <code>#define COLOUR_BLUE <span style="background-color: rgba(0,0,255,0.3); padding: 0 3px; border-radius: 3px;">0x0000FFFF</span></code>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h3>Commands to enable/disable features</h3>
        <div class="settings-grid">
            <div class="setting-item">
                <div class="setting-name">pawnpainter.hex.enabled</div>
                <div class="setting-desc">Toggle hex colour highlighting</div>
            </div>
            <div class="setting-item">
                <div class="setting-name">pawnpainter.hex.style</div>
                <div class="setting-desc">Choose between text, underline, or background highlighting</div>
            </div>
            <div class="setting-item">
                <div class="setting-name">pawnpainter.hex.showAlphaWarnings</div>
                <div class="setting-desc">Show warnings for alpha value of 00</div>
            </div>
        </div>
    </div>
</div>
    
                <div id="gameText" class="tab-pane">
    <h2>GameText Colours</h2>
    <p>Preview SA-MP and open.mp GameText colour codes directly in your string literals.</p>
    
    <div class="section">
        <h3>Supported Formats</h3>
        <div class="code-example">
            <pre><code>// Basic GameText colours
SendClientMessage(playerid, -1, "<span style="color: #9C1719;">~r~Red text</span>");
SendClientMessage(playerid, -1, "<span style="color: #2E5926;">~g~Green text</span>");
SendClientMessage(playerid, -1, "<span style="color: #2B336E;">~b~Blue text</span>");

// Using brightness levels
SendClientMessage(playerid, -1, "<span style="color: #9C1719;">~r~Red</span> <span style="color: #DB5658;">~r~~h~Lighter red</span> <span style="color: #FF9294;">~r~~h~~h~Even lighter</span>");</code></pre>
        </div>
    </div>
    
    <div class="hex-features-container">
        <div class="section hex-features-left">
            <h3>Features:</h3>
            <ul class="feature-list">
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>GameText Colours</strong>
                    </div>
                    <div class="feature-description">
                        Preview all standard GameText colour codes
                    </div>
                </li>
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>Brightness Levels</strong>
                    </div>
                    <div class="feature-description">
                        Support for the ~h~ brightness modifier
                    </div>
                </li>
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>Combined Colours</strong>
                    </div>
                    <div class="feature-description">
                        Mix multiple colours in a single string
                    </div>
                </li>
            </ul>
        </div>
        <div class="section hex-features-right">
            <h3>Available Colours:</h3>
            <div class="gametext-grid">
                <div class="gametext-card">
                    <div class="gametext-code">~r~</div>
                    <div class="gametext-preview" style="color: #9C1719;">Red Text</div>
                </div>
                <div class="gametext-card">
                    <div class="gametext-code">~g~</div>
                    <div class="gametext-preview" style="color: #2E5926;">Green Text</div>
                </div>
                <div class="gametext-card">
                    <div class="gametext-code">~b~</div>
                    <div class="gametext-preview" style="color: #2B336E;">Blue Text</div>
                </div>
                <div class="gametext-card">
                    <div class="gametext-code">~y~</div>
                    <div class="gametext-preview" style="color: #C4A657;">Yellow Text</div>
                </div>
                <div class="gametext-card">
                    <div class="gametext-code">~p~</div>
                    <div class="gametext-preview" style="color: #915ED9;">Purple Text</div>
                </div>
                <div class="gametext-card">
                    <div class="gametext-code">~w~</div>
                    <div class="gametext-preview" style="color: #C4C4C4;">White Text</div>
                </div>
                <div class="gametext-card">
                    <div class="gametext-code">~l~</div>
                    <div class="gametext-preview" style="color: #000000;">Black Text</div>
                </div>
                <div class="gametext-card">
                    <div class="gametext-code">~h~</div>
                    <div class="gametext-preview">Brightness Modifier</div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h3>Commands to enable/disable features</h3>
        <div class="settings-grid">
            <div class="setting-item">
                <div class="setting-name">pawnpainter.gameText.enabled</div>
                <div class="setting-desc">Toggle GameText colour preview</div>
            </div>
            <div class="setting-item">
                <div class="setting-name">pawnpainter.gameText.style</div>
                <div class="setting-desc">Choose between text, underline, or background highlighting</div>
            </div>
        </div>
    </div>
</div>
    
                <div id="inlineColors" class="tab-pane">
    <h2>Inline Colours</h2>
    <p>Preview embedded colour codes in string literals using the {RRGGBB} format.</p>
    
    <div class="section">
        <h3>Supported Formats</h3>
        <div class="code-example">
            <pre><code>// Inline colour examples
SendClientMessage(playerid, -1, "<span style="text-decoration: underline; text-decoration-color: #FF0000;">{FF0000}</span><span style="color: #FF0000;">Red text</span>");
SendClientMessage(playerid, -1, "<span style="text-decoration: underline; text-decoration-color: #00FF00;">{00FF00}</span><span style="color: #00FF00;">Green text</span>");

// Combined colours in one string
SendClientMessage(playerid, -1, "<span style="text-decoration: underline; text-decoration-color: #FF0000;">{FF0000}</span><span style="color: #FF0000;">Red text </span><span style="text-decoration: underline; text-decoration-color: #0000FF;">{0000FF}</span><span style="color: #0000FF;">Blue text</span>");</code></pre>
        </div>
    </div>
    
    <div class="hex-features-container">
        <div class="section hex-features-left">
            <h3>Features:</h3>
            <ul class="feature-list">
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>Code Highlighting</strong>
                    </div>
                    <div class="feature-description">
                        The {RRGGBB} code can be highlighted (typically with underline)
                    </div>
                </li>
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>Text Colouring</strong>
                    </div>
                    <div class="feature-description">
                        The text following the code is coloured to match
                    </div>
                </li>
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>Multiple Colours</strong>
                    </div>
                    <div class="feature-description">
                        Support for multiple colour codes in a single string
                    </div>
                </li>
            </ul>
        </div>
        <div class="section hex-features-right">
            <h3>Visualization Options:</h3>
            <div class="visualization-examples">
                <div class="vis-example">
                    <div class="vis-title">Code + Text:</div>
                    <div class="vis-code-block">
                        <code>"<span style="text-decoration: underline; text-decoration-color: #FF0000;">{FF0000}</span><span style="color: #FF0000;">Red text</span>"</code>
                    </div>
                </div>
                <div class="vis-example">
                    <div class="vis-title">Code Only:</div>
                    <div class="vis-code-block">
                        <code>"<span style="text-decoration: underline; text-decoration-color: #00FF00;">{00FF00}</span>Green text"</code>
                    </div>
                </div>
                <div class="vis-example">
                    <div class="vis-title">Text Only:</div>
                    <div class="vis-code-block">
                        <code>"{0000FF}<span style="color: #0000FF;">Blue text</span>"</code>
                    </div>
                </div>
            </div>
            
            <div class="inline-preview">
                <div class="inline-title">Multiple Colours Example:</div>
                <div class="inline-demo">
                    <span class="inline-code">{FF0000}</span><span style="color: #FF0000;">Red text</span> 
                    <span class="inline-code">{00FF00}</span><span style="color: #00FF00;">Green text</span> 
                    <span class="inline-code">{0000FF}</span><span style="color: #0000FF;">Blue text</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h3>Commands to enable/disable features</h3>
        <div class="settings-grid">
            <div class="setting-item">
                <div class="setting-name">pawnpainter.inlineText.codeEnabled</div>
                <div class="setting-desc">Toggle colour code highlighting ({RRGGBB})</div>
            </div>
            <div class="setting-item">
                <div class="setting-name">pawnpainter.inlineText.textEnabled</div>
                <div class="setting-desc">Toggle text colour highlighting (text after {RRGGBB})</div>
            </div>
            <div class="setting-item">
                <div class="setting-name">pawnpainter.inlineText.codeStyle</div>
                <div class="setting-desc">Style for the code itself (text, underline, background)</div>
            </div>
            <div class="setting-item">
                <div class="setting-name">pawnpainter.inlineText.textStyle</div>
                <div class="setting-desc">Style for the text following the code</div>
            </div>
        </div>
    </div>
</div>
    
                <div id="ignoreLines" class="tab-pane">
    <h2>Ignoring Lines</h2>
    <p>Sometimes you may want to disable colour highlighting for specific lines. PAWN Painter allows you to selectively ignore lines.</p>
    
    <div class="section">
        <h3>Supported Format</h3>
        <div class="code-example">
            <pre><code>// Line with colour that will be highlighted
#define COLOR_RED       <span class="color-preview" style="text-decoration: underline; text-decoration-color: #FF0000;">0xFF0000FF</span>

// Line that has been ignored (right-click → Ignore Colour)
#define COLOR_GREEN     0x00FF00FF    // This line won't show colour highlighting

// You can restore highlighting later (right-click → Restore Colour)
</code></pre>
        </div>
    </div>
    
    <div class="hex-features-container">
        <div class="section hex-features-left">
            <h3>Features:</h3>
            <ul class="feature-list">
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>Selective Ignoring</strong>
                    </div>
                    <div class="feature-description">
                        Disable colour highlighting for specific lines
                    </div>
                </li>
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>Multi-line Selection</strong>
                    </div>
                    <div class="feature-description">
                        Ignore multiple lines at once
                    </div>
                </li>
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>History Tracking</strong>
                    </div>
                    <div class="feature-description">
                        View all currently ignored lines with previews
                    </div>
                </li>
                <li>
                    <div class="feature-header">
                        <span class="feature-bullet"></span>
                        <strong>Easy Restoration</strong>
                    </div>
                    <div class="feature-description">
                        Restore colour highlighting when needed
                    </div>
                </li>
            </ul>
        </div>
        <div class="section hex-features-right">
            <h3>How to Use:</h3>
            <div class="steps">
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h4>Select Lines</h4>
                        <p>Select one or more lines in your code that you want to exclude from highlighting</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h4>Ignore Lines</h4>
                        <p>Right-click and choose "Ignore Colour On Selected Line(s)" from the context menu</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h4>View History</h4>
                        <p>Use "History Of All Ignored Lines" command to see all currently ignored lines</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h4>Restore When Needed</h4>
                        <p>Select lines and use "Restore Colour To Selected Line(s)" to bring back highlighting</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h3>Available Commands</h3>
        <div class="commands-box">
            <div class="command-item">
                <div class="command-name">Ignore Colour On Selected Line(s)</div>
                <div class="command-desc">Disable colour highlighting for the selected line(s)</div>
            </div>
            <div class="command-item">
                <div class="command-name">Restore Colour To Selected Line(s)</div>
                <div class="command-desc">Re-enable colour highlighting for previously ignored line(s)</div>
            </div>
            <div class="command-item">
                <div class="command-name">History Of All Ignored Lines</div>
                <div class="command-desc">View all currently ignored lines with preview</div>
            </div>
            <div class="command-item">
                <div class="command-name">Clear All Ignored Lines</div>
                <div class="command-desc">Reset all ignored line settings</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h3>Common Use Cases</h3>
        <ul class="feature-list">
            <li>
                <div class="feature-header">
                    <span class="feature-bullet"></span>
                    <strong>False Positives</strong>
                </div>
                <div class="feature-description">
                    Disable highlighting for code that matches colour patterns but isn't a colour
                </div>
            </li>
            <li>
                <div class="feature-header">
                    <span class="feature-bullet"></span>
                    <strong>Performance</strong>
                </div>
                <div class="feature-description">
                    Disable highlighting for very large files or sections
                </div>
            </li>
            <li>
                <div class="feature-header">
                    <span class="feature-bullet"></span>
                    <strong>Readability</strong>
                </div>
                <div class="feature-description">
                    Temporarily disable highlighting when it interferes with reading code
                </div>
            </li>
        </ul>
    </div>
</div>
                
                <div id="settings" class="tab-pane">
    <h2>Settings Reference</h2>
    <p>PAWN Painter offers numerous configuration options to customize its behaviour. Here's a complete reference of all available settings.</p>
    
    <div class="hex-features-container">
        <div class="section hex-features-left">
            <h3>General Settings</h3>
            <div class="settings-grid">
                <div class="setting-item">
                    <div class="setting-name">pawnpainter.general.enableColourPicker</div>
                    <div class="setting-desc">Enable or disable VS Code's native colour picker integration</div>
                    <div class="setting-default">Default: true</div>
                </div>
            </div>
            
            <h3>Inline Text Settings</h3>
            <div class="settings-grid">
                <div class="setting-item">
                    <div class="setting-name">pawnpainter.inlineText.codeEnabled</div>
                    <div class="setting-desc">Enable highlighting for the inline colour codes ({RRGGBB})</div>
                    <div class="setting-default">Default: true</div>
                </div>
                <div class="setting-item">
                    <div class="setting-name">pawnpainter.inlineText.textEnabled</div>
                    <div class="setting-desc">Enable highlighting for text following inline colour codes</div>
                    <div class="setting-default">Default: true</div>
                </div>
                <div class="setting-item">
                    <div class="setting-name">pawnpainter.inlineText.codeStyle</div>
                    <div class="setting-desc">Choose how the inline colour code itself should be displayed</div>
                    <div class="setting-default">Default: "underline"</div>
                    <div class="setting-options">Options: "text", "underline", "background"</div>
                </div>
                <div class="setting-item">
                    <div class="setting-name">pawnpainter.inlineText.textStyle</div>
                    <div class="setting-desc">Choose how text following an inline colour should be displayed</div>
                    <div class="setting-default">Default: "text"</div>
                    <div class="setting-options">Options: "text", "underline", "background"</div>
                </div>
            </div>
        </div>
        
        <div class="section hex-features-right">
            <h3>Hex Colour Settings</h3>
            <div class="settings-grid">
                <div class="setting-item">
                    <div class="setting-name">pawnpainter.hex.enabled</div>
                    <div class="setting-desc">Enable hex colour highlighting (0xRRGGBB, 0xRRGGBBAA)</div>
                    <div class="setting-default">Default: true</div>
                </div>
                <div class="setting-item">
                    <div class="setting-name">pawnpainter.hex.style</div>
                    <div class="setting-desc">Choose how hex colour codes should be displayed</div>
                    <div class="setting-default">Default: "underline"</div>
                    <div class="setting-options">Options: "text", "underline", "background"</div>
                </div>
                <div class="setting-item">
                    <div class="setting-name">pawnpainter.hex.showAlphaWarnings</div>
                    <div class="setting-desc">Show warnings for colours with alpha value of 00</div>
                    <div class="setting-default">Default: true</div>
                </div>
            </div>
            
            <h3>GameText Settings</h3>
           <div class="settings-grid">
               <div class="setting-item">
                   <div class="setting-name">pawnpainter.gameText.enabled</div>
                   <div class="setting-desc">Enable colour preview for GameText colour codes (~r~, ~g~, etc)</div>
                   <div class="setting-default">Default: true</div>
               </div>
               <div class="setting-item">
                   <div class="setting-name">pawnpainter.gameText.style</div>
                   <div class="setting-desc">Choose how GameText colours should be displayed</div>
                   <div class="setting-default">Default: "text"</div>
                    <div class="setting-options">Options: "text", "underline", "background"</div>
              </div>
          </div>
      </div>
  </div>
 
  <div class="note">
      <p><strong>Note:</strong> Settings can be modified through VS Code's settings UI (File > Preferences > Settings) or by editing your settings.json file directly.</p>
  </div>
</div>

<div class="sponsor-container">
   <div class="sponsor-section">
       <p class="sponsor-title">Support PAWN Painter</p>
       <p class="sponsor-text">If you find this extension useful in your workflow, please consider supporting its continued development:</p>
       <a href="https://ko-fi.com/itsneufox" class="kofi-custom-button" target="_blank">
           <span class="kofi-icon">☕</span> Support on Ko-fi
       </a>
   </div>
</div>
 
  <div class="footer">
      <button id="closeButton" class="cta-button">Let's paint some code!</button>
      <p class="support">Need help? Visit the <a href="https://github.com/itsneufox/PAWN-Painter-VSC" class="external-link">GitHub repository</a></p>
  </div>
</div>
 
<style>
.sponsor-container {
   padding: 0 1.5rem;
   margin: 0rem 0;
}

.sponsor-section {
   background: rgba(40, 42, 54, 0.5);
   border: 1px solid rgba(80, 80, 100, 0.3);
   border-radius: 12px;
   padding: 1.5rem;
   text-align: center;
   transition: all 0.3s ease;
   box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.sponsor-section:hover {
   transform: translateY(-3px);
   box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
   border-color: rgba(120, 130, 220, 0.4);
}

.sponsor-title {
   font-size: 1.3rem;
   font-weight: bold;
   margin-bottom: 0.8rem;
   color: #3178c6;
}

.sponsor-text {
   color: var(--text-secondary);
   margin-bottom: 1.2rem;
   max-width: 600px;
   margin-left: auto;
   margin-right: auto;
}

.kofi-custom-button {
   display: inline-block;
   background: #29abe0;
   color: white;
   padding: 0.7rem 1.4rem;
   border-radius: 10px;
   text-decoration: none;
   font-weight: bold;
   transition: all 0.3s ease;
   box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.kofi-custom-button:hover {
   transform: translateY(-2px);
   box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
   background: #2eb8f1;
}

.kofi-icon {
   margin-right: 8px;
}

/* Main theme colors and variables */
:root {
  --bg-dark: #1e1e1e;
  --bg-card: rgba(32, 32, 32, 0.7);
  --text-primary: #e0e0e0;
  --text-secondary: #b0b0b0;
  --accent-red: #e06c75;
  --accent-green: #98c379;
  --accent-yellow: #e5c07b;
  --accent-blue: #3178c6;  /* Changed to blue */
  --accent-cyan: #56b6c2;
  --border-color: rgba(90, 90, 90, 0.4);
  --hover-color: rgba(70, 70, 70, 0.7);
  --shadow-color: rgba(0, 0, 0, 0.3);
}

/* Hex color tab specific styles */
.hex-features-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  margin: 1.5rem 0;
}

.hex-features-left, .hex-features-right {
  margin-bottom: 0;
}

.visualization-examples {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.vis-example {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
  position: relative;
}

.vis-example:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px var(--shadow-color);
  border-color: var(--accent-blue);
}

.vis-title {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: var(--accent-cyan);
  word-break: break-word;
  line-height: 1.4;
  display: block;
}

.vis-code-block {
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.8rem;
  border-radius: 6px;
  font-family: var(--vscode-editor-font-family, monospace);
  border-left: 3px solid var(--accent-blue);
}

.color-preview {
  transition: all 0.2s ease;
}

.color-preview:hover {
  font-weight: bold;
}

/* Feature list styles */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.feature-list li {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

.feature-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.6rem;
}

.feature-bullet {
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, 
      var(--accent-blue),
      var(--accent-cyan));
  border-radius: 50%;
  margin-right: 0.7rem;
  display: inline-block;
  box-shadow: 0 0 4px rgba(49, 120, 198, 0.5);
}

.feature-description {
  padding-left: 1.2rem;
  line-height: 1.4;
  word-wrap: break-word;
  color: var(--text-secondary);
}

.feature-list li:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 12px var(--shadow-color);
  border-color: var(--accent-blue);
}

.feature-list li strong {
  display: inline-block;
  margin-bottom: 0;
  color: var(--accent-cyan);
}

/* Inline preview styles */
.inline-preview {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
}

.inline-title {
  word-break: break-word;
  display: block;
  margin-bottom: 1rem;
  color: var(--accent-cyan);
  font-weight: bold;
}

.inline-demo {
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 1.1rem;
  white-space: nowrap;
  overflow-x: auto;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 3px solid var(--accent-blue);
}

/* Settings styles */
.setting-item {
  background: rgba(32, 32, 32, 0.7);
  border: 1px solid rgba(60, 60, 60, 0.7);
  border-radius: 10px;
  padding: 1.2rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.setting-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(100, 100, 100, 0.7);
}

.setting-name {
  font-family: var(--vscode-editor-font-family, monospace);
  color: var(--accent-red);
  margin-bottom: 0.5rem;
  font-weight: bold;
  padding: 0.3rem 0.6rem;
  background: rgba(224, 108, 117, 0.1);
  border-radius: 4px;
  display: inline-block;
}

.setting-desc {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  padding-left: 0.3rem;
}

.setting-default {
  color: var(--accent-green);
  font-size: 0.9rem;
  padding-left: 0.3rem;
}

.setting-options {
  color: var(--accent-yellow);
  font-size: 0.9rem;
  margin-top: 0.5rem;
  padding-left: 0.3rem;
  font-style: italic;
}

@media (max-width: 800px) {
  .hex-features-container {
      grid-template-columns: 1fr;
      gap: 1rem;
  }
  
  .feature-card {
      min-height: 0;
  }
}

body {
  margin: 0;
  padding: 0;
  color: var(--text-primary);
  font-family: var(--vscode-font-family);
  background-color: var(--bg-dark);
  line-height: 1.6;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  text-align: center;
  margin-bottom: 2.5rem;
  padding: 2rem 1rem;
}

.hero h1 {
  font-size: 2.8rem;
  color: var(--accent-blue);
  margin: 0;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Tabs */
.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  padding: 0 1rem;
  gap: 8px;
}

.tab-button {
  background: linear-gradient(135deg, 
      rgba(45, 45, 55, 0.8),
      rgba(35, 35, 45, 0.9));
  border: 1px solid rgba(80, 80, 90, 0.3);
  padding: 0.7rem 1.3rem;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.95rem;
  border-radius: 30px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  opacity: 0.85;
  position: relative;
  overflow: hidden;
}

.tab-button:hover {
  opacity: 1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  background: linear-gradient(135deg, 
      rgba(55, 55, 65, 0.8),
      rgba(45, 45, 55, 0.9));
}

.tab-button.active {
  opacity: 1;
  background: linear-gradient(135deg, 
      #2c5282,
      #3178c6);
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  color: #ffffff;
  border: 1px solid rgba(49, 120, 198, 0.4);
}

/* Tab content */
.tab-content {
  border-radius: 12px;
}

.tab-pane {
  display: none;
  padding: 2rem 1.5rem 1rem;
  border-radius: 12px;
}

.tab-pane.active {
  display: block;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

h2 {
  color: var(--accent-blue);
  margin-top: 0;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.8rem;
  margin-bottom: 1.5rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

h3 {
  color: var(--accent-cyan);
  margin: 1.5rem 0 0.5rem 0;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(86, 182, 194, 0.2);
  padding-bottom: 0.4rem;
}

h4 {
  margin: 0 0 0.5rem 0;
  color: var(--accent-yellow);
}

.section {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px dashed var(--border-color);
}

.section:last-child {
   border-bottom: none;
   margin-bottom: 0.5rem;
   padding-bottom: 0.5rem;
}

/* Feature grid */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.feature-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-height: 110px;
  position: relative;
}

.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  border-color: var(--accent-blue);
}

.feature-icon {
  font-size: 2.2rem;
  margin-right: 1.2rem;
  min-width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(49, 120, 198, 0.1);
  border-radius: 50%;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feature-content h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  line-height: 1.3;
  word-wrap: break-word;
  color: var(--accent-cyan);
  border-bottom: none;
}

.feature-content p {
  margin: 0;
  word-wrap: break-word;
  line-height: 1.4;
  color: var(--text-secondary);
}

/* Examples */
.code-example {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  margin: 1rem 0;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

pre {
  margin: 0;
  padding: 1.2rem;
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 0.9rem;
  white-space: pre;
  overflow-x: auto;
}

code {
  font-family: var(--vscode-editor-font-family, monospace);
  background: rgba(49, 120, 198, 0.08);
  padding: 2px 4px;
  border-radius: 3px;
}

/* Commands table */
.commands-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.commands-table th, .commands-table td {
  text-align: left;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.commands-table th {
  color: var(--accent-cyan);
  font-weight: bold;
  background: rgba(86, 182, 194, 0.1);
}

.commands-table tr:last-child td {
  border-bottom: none;
}

.commands-table tr:hover td {
  background: rgba(49, 120, 198, 0.05);
}

/* GameText grid */
.gametext-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.gametext-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 1.2rem;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
}

.gametext-card:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  border-color: var(--accent-blue);
}

.gametext-code {
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 1.1rem;
  margin-bottom: 0.8rem;
  color: var(--accent-cyan);
  background: rgba(86, 182, 194, 0.1);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  display: inline-block;
}

.gametext-preview {
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

/* Commands box */
.commands-box {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.command-item {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 1.2rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
}

.command-item:hover {
  transform: translateX(5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  border-color: var(--accent-blue);
}

.command-name {
  font-weight: bold;
  color: var(--accent-red);
  margin-bottom: 0.5rem;
  padding: 0.3rem 0.6rem;
  background: rgba(224, 108, 117, 0.1);
  border-radius: 4px;
  display: inline-block;
}

/* Steps */
.steps {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.step {
  display: flex;
  align-items: flex-start;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
}

.step:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-color: var(--accent-blue);
}

.step-number {
background: linear-gradient(135deg, 
   var(--accent-blue),
   var(--accent-cyan));
color: #ffffff;
width: 36px;
height: 36px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
font-weight: bold;
margin-right: 1.2rem;
flex-shrink: 0;
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.step-content h4 {
margin-top: 0;
color: var(--accent-yellow);
}

.step-content p {
margin-bottom: 0;
color: var(--text-secondary);
}

/* Note */
.note {
background: linear-gradient(135deg, 
   rgba(152, 195, 121, 0.08), 
   rgba(152, 195, 121, 0.03));
border-left: 4px solid var(--accent-green);
padding: 1.2rem;
border-radius: 0 8px 8px 0;
margin: 1rem 0 0.5rem 0;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.note p {
margin: 0;
}

.note strong {
color: var(--accent-green);
}

.footer {
   text-align: center;
   margin-top: 1rem;
   padding-top: 1.5rem;
   border-top: 1px solid var(--border-color);
}

.cta-button {
  background: linear-gradient(135deg, 
      #2c5282,
      #3178c6);
  color: #ffffff;
  border: none;
  padding: 0.9rem 2rem;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, 
      #3a6bac,
      #4a8be6);
}

.support {
margin-top: 1.2rem;
color: var(--text-secondary);
font-size: 0.9rem;
}

.external-link {
color: var(--accent-cyan);
text-decoration: none;
padding: 0.2rem 0.4rem;
border-radius: 4px;
transition: all 0.2s ease;
}

.external-link:hover {
text-decoration: underline;
background-color: rgba(86, 182, 194, 0.1);
}

@media (max-width: 800px) {
.tabs {
   flex-direction: column;
   padding: 0;
}

.tab-button {
   width: 100%;
   text-align: center;
   border-radius: 30px;
   margin: 4px 0;
}

.feature-grid {
   grid-template-columns: 1fr;
}

.hero h1 {
  font-size: 2.8rem;
  background: linear-gradient(135deg, #3178c6, #56b6c2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  margin-bottom: 0.5rem;
  text-shadow: none;
  font-weight: bold;
}

.container {
   padding: 1rem;
   margin: 0.5rem;
}

.gametext-grid {
   grid-template-columns: 1fr 1fr;
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
padding: 0 5px;
}

@keyframes shine {
to {
   background-position: 200% center;
}
}
</style>

<script>
  <script>
      const vscode = acquireVsCodeApi();
      
      document.getElementById('closeButton').addEventListener('click', () => {
          vscode.postMessage({ type: 'close' });
      });

      function openTab(tabName) {
          const tabContents = document.getElementsByClassName('tab-pane');
          for (let i = 0; i < tabContents.length; i++) {
              tabContents[i].classList.remove('active');
          }

          const tabButtons = document.getElementsByClassName('tab-button');
          for (let i = 0; i < tabButtons.length; i++) {
              tabButtons[i].classList.remove('active');
          }

          document.getElementById(tabName).classList.add('active');

          const buttons = document.querySelectorAll('.tab-button');
          buttons.forEach(button => {
              if (button.getAttribute('onclick').includes(tabName)) {
                  button.classList.add('active');
              }
          });
      }
</script>
    </body>
</html>`;
    }
}