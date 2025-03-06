module.exports = {
    root: true,
    overrides: [
        {
            files: ["**/*.ts"],
            extends: [
                "plugin:@typescript-eslint/recommended",
                "plugin:import/typescript"
            ],

            parser: "@typescript-eslint/parser",

            parserOptions: {
                project: true
            },

            plugins: ["@typescript-eslint"],

            settings: {
                "import/resolver": {
                    typescript: true,
                    node: true
                }
            },

            rules: {
                // Allow explicit any
                "@typescript-eslint/no-explicit-any": "off",

                // Allow TS comments
                "@typescript-eslint/ban-ts-comment": "off",

                // This conflicts with "keyword-spacing"
                "@typescript-eslint/keyword-spacing": "off",

                // Allow namespaces
                "@typescript-eslint/no-namespace": "off",

                // Enforce brace style
                "curly": "error",

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
                ]
            }
        }
    ]
}