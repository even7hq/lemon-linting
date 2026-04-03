module.exports = {
    root: true,
    overrides: [
        {
            files: ["**/*.ts"],
            extends: [
                "plugin:@typescript-eslint/recommended",
                "plugin:import/typescript"
            ],

            parser: require.resolve("@typescript-eslint/parser"),

            parserOptions: {
                project: true
            },

            plugins: ["@typescript-eslint"],

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

                // Disabled — unused-imports/no-unused-vars (in common.js) handles this with autofix
                "@typescript-eslint/no-unused-vars": "off",

                // Allow TS comments
                "@typescript-eslint/ban-ts-comment": "off",

                // This conflicts with "keyword-spacing"
                "keyword-spacing": "off",

                // Allow namespaces
                "@typescript-eslint/no-namespace": "off",

                // Enforce brace style
                "curly": "error",

                // Enforce else if on new line
                "brace-style": ["error", "1tbs", { "allowSingleLine": false }],

                // Enforce semicolons
                "semi": ["warn", "always"],

                // Disable inline if statements
                "nonblock-statement-body-position": ["error", "below"],

                // Enforce new lines after complex blocks, and before if statements
                "padding-line-between-statements": [
                    "warn",
                    {
                        "blankLine": "always",
                        "prev": [
                            "block",
                            "multiline-block-like",
                            "multiline-expression",
                            "multiline-const",
                            "multiline-let",
                            "multiline-var"
                        ],
                        "next": "*"
                    },
                    {
                        "blankLine": "always",
                        "prev": ["const", "let", "var", "expression", "return", "throw", "export", "import", "function", "class", "for", "while", "do", "switch", "try"],
                        "next": "if"
                    },
                    {
                        "blankLine": "any",
                        "prev": ["if", "block-like"],
                        "next": "if"
                    }
                ],

                // Deny using multiple empty lines
                "no-multiple-empty-lines": ["warn", {
                    "max": 1
                }],

                // Enforce using camel case
                "@typescript-eslint/naming-convention": ["warn",
                    {
                        "selector": "variableLike",
                        "format": ["camelCase", "PascalCase", "UPPER_CASE"],
                        "filter": {
                            "match": false,
                            "regex": "^\_+"
                        }
                    },
                    {
                        "selector": "parameter",
                        "format": ["camelCase"],
                        "filter": {
                            "match": false,
                            "regex": "^\_+"
                        }
                    },
                    {
                        "selector": ["classProperty", "classMethod"],
                        "format": ["camelCase", "snake_case"]
                    },
                    // Allow UPPER_CASE static properties
                    {
                        "selector": ["classProperty"],
                        "modifiers": ["static"],
                        "format": ["camelCase", "snake_case", "UPPER_CASE"]
                    },
                    // Enforce enums to be uppercase
                    {
                        "selector": "enumMember",
                        "format": ["UPPER_CASE"]
                    },
                    {
                        "selector": "typeLike",
                        "format": ["PascalCase"]
                    },
                ],

                // Only double quotes
                "quotes": ["error", "double", {
                    avoidEscape: false,
                    allowTemplateLiterals: true
                }],

                // Override base indent to add SwitchCase indentation
                // ignoredNodes:
                //   - IfStatement > IfStatement.alternate: allows the } else\nif pattern
                //   - ConditionalExpression > *: avoids false positives for nested ternaries in spreads/object literals
                indent: ["warn", 4, {
                    SwitchCase: 1,
                    ignoredNodes: [
                        "IfStatement > IfStatement.alternate",
                        "ConditionalExpression > ObjectExpression",
                        "ConditionalExpression > ObjectExpression > *"
                    ]
                }],

                // Allow unresolved imports
                // This causes false positives in some cases
                "import/no-unresolved": "off",
            }
        }
    ]
}
