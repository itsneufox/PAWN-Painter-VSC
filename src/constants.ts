export const EXTENSION = {
    ID: 'pawnpainter',
    PUBLISHER: 'itsneufox',
    FULL_NAME: 'itsneufox.pawn-painter'
};

export const COMMANDS = {
    TOGGLE_HEX_COLOR: 'pawnpainter.toggleHexColourHighlight',
    TOGGLE_INLINE_COLORS: 'pawnpainter.toggleInlineColours',
    TOGGLE_GAMETEXT_COLORS: 'pawnpainter.toggleGameTextColorPicker',
    TOGGLE_COLOR_PICKER: 'pawnpainter.toggleNormalColorPicker'
};

export const CONFIG_KEYS = {
    GENERAL: {
        ENABLE_COLOR_PICKER: 'general.enableColourPicker'
    },
    HEX: {
        ENABLED: 'hex.enabled',
        STYLE: 'hex.style',
        SHOW_ALPHA_WARNINGS: 'hex.showAlphaWarnings'
    },
    GAME_TEXT: {
        ENABLED: 'gameText.enabled',
        STYLE: 'gameText.style'
    },
    INLINE_TEXT: {
        ENABLED: 'inlineText.enabled',
        STYLE: 'inlineText.style'
    }
};

export const REGEX_PATTERNS = {
    HEX_COLOR: /(?:0x[0-9A-F]{6,8}|\{[0-9A-F]{6}\})/gi,
    RGB_COLOR: /(?:^|[^\d.])(\d{1,3})\s,\s(\d{1,3})\s,\s(\d{1,3})(?:\s,\s(\d{1,3}))?\b/g,
    QUOTED_TEXT: /"[^"]*"/g,
    GAME_TEXT_COLOR: /~([rgbyplws])~(?:~h~)*/g,
    FUNCTION_CALL: /\b[A-Za-z_][A-Za-z0-9_]*\s*\(/,
    TEXT_DRAW_FUNCTION: /(?:Player)?TextDraw(?:Colour|Color)/,
    COLOR_TAG: /\{([0-9A-Fa-f]{6})\}(.*?)(?=\{[0-9A-Fa-f]{6}\}|")/g
};

export const DECORATION_STYLES = {
    TEXT: 'text',
    UNDERLINE: 'underline',
    BACKGROUND: 'background'
} as const;

export const UI_MESSAGES = {
    TOGGLE_MESSAGES: {
        HEX_COLOR: (enabled: boolean) => 
            `Hex Colour Highlighting ${enabled ? 'enabled' : 'disabled'}`,
        INLINE_COLOR: (enabled: boolean) => 
            `Inline Colour Highlighting ${enabled ? 'enabled' : 'disabled'}`,
        GAME_TEXT: (enabled: boolean) => 
            `GameText Colour Preview ${enabled ? 'enabled' : 'disabled'}`,
        COLOR_PICKER: (enabled: boolean) => 
            `Normal Colour Picker ${enabled ? 'enabled' : 'disabled'}`
    },
    WARNINGS: {
        ZERO_ALPHA: "This colour has alpha value of 00.\n" +
                   "If it's intentional or you use bitwise operations,\n" +
                   "consider disregarding this message!"
    }
};

export const STATE_KEYS = {
    LAST_VERSION: 'pawnpainter.lastVersion'
};

export const VIEWPORT = {
    BUFFER_SIZE: 200,
    UPDATE_DELAY: 100
};