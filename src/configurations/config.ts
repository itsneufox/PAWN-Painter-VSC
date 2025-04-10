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
        codeEnabled: boolean;
        textEnabled: boolean;
        codeStyle: DecorationStyle;
        textStyle: DecorationStyle;
    };
}

export type DecorationStyle = 'text' | 'underline' | 'background';

export const DEFAULT_CONFIG: ExtensionConfig = {
    general: {
        enableColourPicker: true,
    },
    hex: {
        enabled: true,
        style: 'underline',
        showAlphaWarnings: true,
    },
    gameText: {
        enabled: true,
        style: 'text',
    },
    inlineText: {
        codeEnabled: true,
        textEnabled: true,
        codeStyle: 'underline',
        textStyle: 'text',
    },
};
