export interface ExtensionConfig {
    general: {
        enableColourPicker: boolean;
    };
    hex: {
        enabled: boolean;
        style: DecorationStyle;
        showAlphaWarnings: boolean;
    };
    gameText: {
        enabled: boolean;
        style: DecorationStyle;
    };
    inlineText: {
        enabled: boolean;
        style: DecorationStyle;
    };
}

export type DecorationStyle = 'text' | 'underline' | 'background';

export const DEFAULT_CONFIG: ExtensionConfig = {
    general: {
        enableColourPicker: true
    },
    hex: {
        enabled: true,
        style: 'underline',
        showAlphaWarnings: true
    },
    gameText: {
        enabled: true,
        style: 'text'
    },
    inlineText: {
        enabled: true,
        style: 'text'
    }
};