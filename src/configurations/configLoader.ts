import * as vscode from 'vscode';
import { ExtensionConfig, DEFAULT_CONFIG } from './config';

export class ConfigurationLoader {
    private static instance: ConfigurationLoader;
    private currentConfig: ExtensionConfig;

    private constructor() {
        this.currentConfig = { ...DEFAULT_CONFIG };
        this.loadConfiguration();
    }

    public static getInstance(): ConfigurationLoader {
        if (!ConfigurationLoader.instance) {
            ConfigurationLoader.instance = new ConfigurationLoader();
        }
        return ConfigurationLoader.instance;
    }

    public getConfig(): ExtensionConfig {
        return this.currentConfig;
    }

    private configCache: Map<string, any> = new Map();

    public loadConfiguration(): void {
        const vsConfig = vscode.workspace.getConfiguration('pawnpainter');

        // Update the configuration with values from VS Code settings
        this.currentConfig = {
            general: {
                enableColourPicker: vsConfig.get('general.enableColourPicker', DEFAULT_CONFIG.general.enableColourPicker)
            },
            hex: {
                enabled: vsConfig.get('hex.enabled', DEFAULT_CONFIG.hex.enabled),
                style: vsConfig.get('hex.style', DEFAULT_CONFIG.hex.style),
                showAlphaWarnings: vsConfig.get('hex.showAlphaWarnings', DEFAULT_CONFIG.hex.showAlphaWarnings)
            },
            gameText: {
                enabled: vsConfig.get('gameText.enabled', DEFAULT_CONFIG.gameText.enabled),
                style: vsConfig.get('gameText.style', DEFAULT_CONFIG.gameText.style)
            },
            inlineText: {
                enabled: vsConfig.get('inlineText.enabled', DEFAULT_CONFIG.inlineText.enabled),
                codeStyle: vsConfig.get('inlineText.codeStyle', DEFAULT_CONFIG.inlineText.codeStyle),
                textStyle: vsConfig.get('inlineText.textStyle', DEFAULT_CONFIG.inlineText.textStyle)
            }
        };
    }

    public async updateConfig<K extends keyof ExtensionConfig>(
        section: K,
        key: keyof ExtensionConfig[K],
        value: ExtensionConfig[K][keyof ExtensionConfig[K]]
    ): Promise<void> {
        const vsConfig = vscode.workspace.getConfiguration('pawnpainter');
        await vsConfig.update(`${String(section)}.${String(key)}`, value, vscode.ConfigurationTarget.Global);
        
        // Immediately update the local config to reflect changes
        if (section in this.currentConfig && key in this.currentConfig[section]) {
            (this.currentConfig[section] as any)[key] = value;
        }
        
        // Reload full configuration to ensure consistency
        this.loadConfiguration();
    }
}