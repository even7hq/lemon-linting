const commonConfig = require("./common.config");
const typescriptConfig = require("./typescript.config");
const localPlugin = require("./custom");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
    ...commonConfig,
    ...typescriptConfig,

    {
        files: ["**/*.tsx", "**/*.jsx"],

        languageOptions: {
            parserOptions: {
                ecmaFeatures: { jsx: true }
            }
        }
    },

    {
        plugins: {
            local: localPlugin
        },

        rules: {
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

            // Require a blank JSX line before conditional (&&) and map expressions
            "local/jsx-newline-before-block-expression": "warn",

            // Require a blank JSX line between sibling elements that have children
            "local/jsx-newline-between-elements-with-children": "warn"
        }
    }
];
