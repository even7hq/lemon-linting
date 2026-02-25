/**
 * Noop ESLint parser that returns an empty AST.
 * Used to make ESLint skip blocks with unsupported languages (e.g. Lua in Vue SFCs).
 * Without this, vue-eslint-parser attempts to parse the block content as JS/TS and fails.
 */
module.exports = {
    parseForESLint(code, options) {
        return {
            ast: {
                type: "Program",
                body: [],
                sourceType: options?.sourceType || "module",
                tokens: [],
                comments: [],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 0 }
                },
                range: [0, 0]
            },
            services: {},
            scopeManager: null,
            visitorKeys: {
                Program: []
            }
        };
    }
};
