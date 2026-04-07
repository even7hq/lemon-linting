const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const importPlugin = require("eslint-plugin-import-x");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
    {
        files: ["**/*.ts", "**/*.tsx"],

        plugins: {
            "@typescript-eslint": tsPlugin,
            import: importPlugin
        },

        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: true
            }
        },

        settings: {
            "import/resolver": {
                typescript: {
                    alwaysTryTypes: true,
                    extensions: [".ts", ".tsx", ".d.ts", ".js", ".jsx", ".json"]
                },
                node: true
            }
        },

        rules: {
            // Allow explicit any
            "@typescript-eslint/no-explicit-any": "off",

            // Disabled — local/remove-unused-vars handles this with autofix
            "@typescript-eslint/no-unused-vars": "off",

            // Allow TS comments
            "@typescript-eslint/ban-ts-comment": "off",

            // This conflicts with keyword-spacing
            "keyword-spacing": "off",

            // Allow namespaces
            "@typescript-eslint/no-namespace": "off",

            // Enforce brace style
            curly: "error",

            // Enforce else if on new line
            "brace-style": ["error", "1tbs", { allowSingleLine: false }],

            // Enforce semicolons
            semi: ["warn", "always"],

            // Disable inline if statements
            "nonblock-statement-body-position": ["error", "below"],

            // Enforce new lines after complex blocks, and before if statements
            "padding-line-between-statements": [
                "warn",
                {
                    blankLine: "always",
                    prev: [
                        "block",
                        "multiline-block-like",
                        "multiline-expression",
                        "multiline-const",
                        "multiline-let",
                        "multiline-var"
                    ],
                    next: "*"
                },
                {
                    blankLine: "always",
                    prev: ["const", "let", "var", "expression", "return", "throw", "export", "import", "function", "class", "for", "while", "do", "switch", "try"],
                    next: "if"
                },
                {
                    blankLine: "any",
                    prev: ["if", "block-like"],
                    next: "if"
                }
            ],

            // Deny using multiple empty lines
            "no-multiple-empty-lines": ["warn", { max: 1 }],

            // Enforce using camel case
            "@typescript-eslint/naming-convention": [
                "warn",
                {
                    selector: "variableLike",
                    format: ["camelCase", "PascalCase", "UPPER_CASE"],
                    filter: { match: false, regex: "^_+" }
                },
                {
                    selector: "parameter",
                    format: ["camelCase"],
                    filter: { match: false, regex: "^_+" }
                },
                {
                    selector: ["classProperty", "classMethod"],
                    format: ["camelCase", "snake_case"]
                },
                {
                    selector: ["classProperty"],
                    modifiers: ["static"],
                    format: ["camelCase", "snake_case", "UPPER_CASE"]
                },
                {
                    selector: "enumMember",
                    format: ["UPPER_CASE"]
                },
                {
                    selector: "typeLike",
                    format: ["PascalCase"]
                }
            ],

            // Only double quotes
            quotes: ["error", "double", {
                avoidEscape: false,
                allowTemplateLiterals: true
            }],

            // Override base indent — ignoredNodes allows } else\nif pattern and nested ternaries
            indent: ["warn", 4, {
                SwitchCase: 1,
                ignoredNodes: [
                    "IfStatement > IfStatement.alternate",
                    "ConditionalExpression > ObjectExpression",
                    "ConditionalExpression > ObjectExpression > *"
                ]
            }],

            // Allow unresolved imports — causes false positives in some cases
            "import/no-unresolved": "off"
        }
    }
];
