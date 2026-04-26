const js = require("@eslint/js");
const globals = require("globals");
const importPlugin = require("eslint-plugin-import-x");
const unusedImports = require("eslint-plugin-unused-imports");
const localPlugin = require("./custom");

/**
 * All local/* rules, extracted so vue.config.js can re-declare them
 * under the vue-eslint-parser context (where the plugin must be re-registered).
 *
 * @type {Record<string, import("eslint").Linter.RuleEntry>}
 */
const localRules = {
    "local/remove-unused-vars": ["warn", {
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_"
    }],
    "local/max-inline-calls": ["warn", { max: 3 }],
    "local/prefer-else-newline-if": "warn",
    "local/require-jsdoc-param-returns": "warn",
    "local/require-blank-line-between-documented-props": "warn",
    "local/require-multiline-jsdoc": "warn",
    "local/require-jsdoc-on-upper-case-const": "warn",
    "local/prefer-jsdoc-comment": "warn",
    "local/blank-line-after-block-prop": "warn",
    "local/no-await-import": "warn",
    "local/require-blank-lines-around-jsdoc": "warn",
    "local/require-jsdoc-throws": "warn"
};

/** @type {import("eslint").Linter.Config[]} */
const config = [
    js.configs.recommended,

    {
        plugins: {
            import: importPlugin,
            "unused-imports": unusedImports,
            local: localPlugin
        },

        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.es2021
            }
        },

        rules: {
            // 4-space indentation
            indent: ["warn", 4, { SwitchCase: 1 }],

            // Comments must be on their own line — not inline after statements
            "no-inline-comments": "warn",

            // Only double quotes
            quotes: ["warn", "double"],

            // Allow only console.debug
            "no-console": ["error", { allow: ["debug"] }],

            // Disable no-undef because it conflicts with the default language server
            "no-undef": "off",

            // Block async promise executor
            "no-async-promise-executor": "error",

            // Objects need to have a newline
            // Only enforce consistency — never force newlines based on property count.
            // The ESLint indent rule does not correctly re-indent objects that are broken
            // by object-curly-newline when they appear as function call arguments,
            // producing col-0 closing braces after autofix.
            "object-curly-newline": ["warn", { multiline: true, consistent: true }],

            // Object properties need a newline
            "object-property-newline": ["warn", { allowAllPropertiesOnSameLine: true }],

            // No trailing commas
            "comma-dangle": ["warn", "never"],

            // No extra semicolons
            "no-extra-semi": "error",

            // No trailing spaces
            "no-trailing-spaces": ["warn", { ignoreComments: true }],

            // Disallow multiple consecutive spaces (alignment padding)
            "no-multi-spaces": ["warn", { ignoreEOLComments: true, exceptions: {} }],

            // Use arrow function callbacks
            "prefer-arrow-callback": "error",

            // Use parentheses in arrow functions
            "arrow-parens": "error",

            // Requires `const` for never-reused variables
            "prefer-const": "error",

            // Enforce `for` loop update moving the counter in the right direction
            "for-direction": "error",

            // Enforce spaces before blocks
            "space-before-blocks": ["error", "always"],

            // Enforce spaces after blocks
            "block-spacing": ["error", "always"],

            // Enforce spaces after keywords
            "keyword-spacing": "error",

            // Disabled — local/remove-unused-vars handles this with autofix
            "no-unused-vars": "off",

            // Autofixable: removes unused imports
            "unused-imports/no-unused-imports": "warn",

            // Autofixable: removes unused variable/type/interface/enum declarations
            ...localRules,

            // Allow extra boolean casting
            "no-extra-boolean-cast": "off",

            // Conflicts with namespaces
            "no-inner-declarations": "off",

            // Import order — pathGroups pins workspace/alias imports so the order never flips
            "import/order": [
                "warn",
                {
                    groups: ["builtin", "external", "internal", "parent", "sibling"],
                    pathGroups: [
                        { pattern: "@*/*", group: "external", position: "after" },
                        { pattern: "@*/", group: "external", position: "after" },
                        { pattern: "@/**", group: "internal" },
                        { pattern: "~**", group: "internal" }
                    ],
                    pathGroupsExcludedImportTypes: ["builtin"],
                    alphabetize: { order: "asc" }
                }
            ]
        }
    }
];

module.exports = config;
module.exports.localPlugin = localPlugin;
module.exports.localRules = localRules;
