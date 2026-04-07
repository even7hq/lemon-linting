const js = require("@eslint/js");
const globals = require("globals");
const importPlugin = require("eslint-plugin-import-x");
const unusedImports = require("eslint-plugin-unused-imports");
const localPlugin = require("./custom");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
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
            "object-curly-newline": ["warn", {
                ObjectExpression: {
                    multiline: true,
                    consistent: true,
                    minProperties: 3
                }
            }],

            // Object properties need a newline
            "object-property-newline": ["warn", { allowAllPropertiesOnSameLine: true }],

            // No trailing commas
            "comma-dangle": ["warn", "never"],

            // No extra semicolons
            "no-extra-semi": "error",

            // No trailing spaces
            "no-trailing-spaces": ["warn", { ignoreComments: true }],

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
            "local/remove-unused-vars": ["warn", {
                varsIgnorePattern: "^_",
                argsIgnorePattern: "^_"
            }],

            // Allow extra boolean casting
            "no-extra-boolean-cast": "off",

            // Conflicts with namespaces
            "no-inner-declarations": "off",

            // Disallow more than 3 call expressions on a single line
            "local/max-inline-calls": ["warn", { max: 3 }],

            // Prefer `} else\nif` over `} else if` for chained conditionals
            "local/prefer-else-newline-if": "warn",

            // Require @param and @returns on documented functions and methods
            "local/require-jsdoc-param-returns": "warn",

            // Require blank line between interface/type properties when any has a JSDoc block
            "local/require-blank-line-between-documented-props": "warn",

            // Require JSDoc comments to use multiline format
            "local/require-multiline-jsdoc": "warn",

            // Require multiline JSDoc on UPPER_CASE const declarations
            "local/require-jsdoc-on-upper-case-const": "warn",

            // Convert standalone // comments before declarations into /** */ docblocks
            "local/prefer-jsdoc-comment": "warn",

            // Require blank line before a property that follows a closing } or )
            "local/blank-line-after-block-prop": "warn",

            // Disallow await import() with static paths unless justified with a @tag comment
            "local/no-await-import": "warn",

            // Require a blank line before and after JSDoc block comments
            "local/require-blank-lines-around-jsdoc": "warn",

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
