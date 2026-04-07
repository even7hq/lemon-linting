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
            // Require a blank JSX line before conditional (&&) and map expressions
            "local/jsx-newline-before-block-expression": "warn",

            // Require a blank JSX line between sibling elements that have children
            "local/jsx-newline-between-elements-with-children": "warn"
        }
    }
];
