/**
 * Minimal ESLint parser for Zig source files.
 * Rules operate on raw text via Program(); no full AST is required.
 */

/** @type {import("eslint").Parser} */
module.exports = {
    meta: {
        name: "zig-parser",
        version: "1.0.0"
    },

    /**
     * Parses Zig source into a stub Program node for ESLint.
     *
     * @param code Zig source text.
     * @returns Parser result with ast and scopeManager stubs.
     */
    parseForESLint(code) {
        const ast = {
            type: "Program",
            body: [],
            sourceType: "module",
            range: [0, code.length],
            loc: {
                start: { line: 1, column: 0 },
                end: {
                    line: code.split("\n").length,
                    column: 0
                }
            },
            tokens: [],
            comments: []
        };

        const globalScope = {
            type: "global",
            block: ast,
            variables: [],
            references: [],
            set: new Map(),
            through: [],
            variableScope: null,
            upper: null
        };

        return {
            ast,
            services: {},
            scopeManager: {
                scopes: [globalScope],
                globalScope,
                getDeclaredVariables: () => []
            },
            visitorKeys: {
                Program: ["body"]
            }
        };
    }
};
