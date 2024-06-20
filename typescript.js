module.exports = {
    root: true,

    extends: [
        "plugin:@typescript-eslint/recommended"
    ],

    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],

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
                "selector": "default",
                "format": ["camelCase"]
            },
            {
                "selector": "variableLike",
                "format": ["camelCase", "PascalCase"]
            },
            {
                "selector": "parameter",
                "format": ["camelCase"]
            },
            {
                "selector": "memberLike",
                "format": ["camelCase", "snake_case"]
            },
            // To allow object properties containing "-"
            {
                "selector": "objectLiteralProperty",
                "format": [],
                "custom": {
                    "match": true,
                    "regex": ""
                },
                "filter": {
                    "match": true,
                    "regex": "-"
                }
            },
            {
                "selector": "typeLike",
                "format": ["PascalCase"]
            },
        ]
    }
}