const importPlugin = require("eslint-plugin-import-x");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

/**
 * Rules that apply to any file with TypeScript content - .ts, .tsx, .vue <script lang="ts">,
 * .svelte <script lang="ts">, etc. Exported so Vue/Svelte configs can re-apply them in their
 * own parser context where the typescript.config files/glob does not match.
 *
 * @type {Record<string, import("eslint").Linter.RuleEntry>}
 */
const tsRules = {
    // Allow explicit any in type annotations - casts are banned via local/no-unsafe-type-assertion
    "@typescript-eslint/no-explicit-any": "off",

    "local/no-unsafe-type-assertion": "error",
    "local/no-reflect-typing": "error",
    "local/no-catch-any": "error",

    // Disabled - local/remove-unused-vars handles this with autofix
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
            // Destructured variables may come from external APIs with snake_case keys.
            selector: "variable",
            modifiers: ["destructured"],
            format: ["camelCase", "PascalCase", "UPPER_CASE", "snake_case"]
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
            format: ["PascalCase", "UPPER_CASE"]
        }
    ],

    // Only double quotes
    quotes: ["error", "double", {
        avoidEscape: false,
        allowTemplateLiterals: true
    }],

    // Override base indent - ignoredNodes allows } else\nif pattern and nested ternaries
    indent: ["warn", 4, {
        SwitchCase: 1,
        // Ignore comment lines - `/*` inside JSDoc text confuses the indent tokenizer
        // and produces false "Expected indentation of 0" errors on following lines.
        ignoreComments: true,
        ignoredNodes: [
            "IfStatement > IfStatement.alternate",
            "ConditionalExpression > ObjectExpression",
            "ConditionalExpression > ObjectExpression > *",
            // Allows trailing arguments of a multiline call to be indented
            // at the call level rather than the inner expression level.
            // e.g. setTimeout(() => ..., delay) where delay is on its own line.
            "CallExpression > .arguments:not(:first-child)",
            // Class property initializers with inline type annotations produce
            // false positives because the type body shifts the indent reference.
            // e.g. `public foo: { bar: string } = { bar: "x" }`
            "PropertyDefinition > ObjectExpression",
            "PropertyDefinition > ObjectExpression > *"
        ]
    }],

    // Allow unresolved imports - causes false positives in some cases
    "import/no-unresolved": "off",

    // Disable the base rule - it does not understand TS overloads and flags
    // every overload signature as a redeclaration.
    "no-redeclare": "off",
    "@typescript-eslint/no-redeclare": ["error", { ignoreDeclarationMerge: true }],

    // Disable the base rule - it does not understand TS overload signatures and
    // flags them as duplicate class members.
    "no-dupe-class-members": "off",
    "@typescript-eslint/no-dupe-class-members": "error",

    // Enforce `import type` when the import is only used as a type.
    "@typescript-eslint/consistent-type-imports": ["warn", {
        prefer: "type-imports",
        fixStyle: "separate-type-imports",
        disallowTypeAnnotations: false
    }],

    // Prefer `interface` over `type` for object shapes (unions, mapped types, etc. stay as `type`).
    "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],

    "local/no-inline-object-literal": ["warn", { maxShorthandProperties: 2 }]
};

/**
 * @type {import("eslint").Linter.Config[]}
 */
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

        rules: tsRules
    },

    {
        files: ["**/*.ts", "**/*.tsx"],
        processor: "local/filter-indent-return-type-close"
    },

    {
        // padding-line-between-statements only for .ts - JSX/TSX files have mixed
        // statement/expression contexts that cause autofix to corrupt indentation.
        files: ["**/*.ts"],

        rules: {
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
            ]
        }
    }
];

module.exports.tsRules = tsRules;
module.exports.tsPlugin = tsPlugin;
