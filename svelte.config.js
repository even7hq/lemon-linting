const commonConfig = require("./common.config");
const { localPlugin, localRules } = require("./common.config");
const typescriptConfig = require("./typescript.config");
const { tsRules, tsPlugin } = require("./typescript.config");
const sveltePlugin = require("eslint-plugin-svelte");
const svelteParser = require("svelte-eslint-parser");
const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
    ...commonConfig,
    ...typescriptConfig,

    // svelte-eslint-parser as the main parser for .svelte files
    ...sveltePlugin.configs["flat/recommended"],

    {
        files: ["**/*.svelte"],

        // Re-register the local plugin because svelte-eslint-parser creates its own
        // config context for .svelte files, where plugins from common.config are not inherited.
        plugins: {
            local: localPlugin,
            "@typescript-eslint": tsPlugin
        },

        languageOptions: {
            parser: svelteParser,
            globals: {
                ...globals.browser,
                ...globals.node
            },
            parserOptions: {
                parser: tsParser,
                extraFileExtensions: [".svelte"]
            }
        },

        rules: {
            // Re-apply all local/* rules so they work inside Svelte <script> blocks
            ...localRules,

            // Re-apply TypeScript rules - typescript.config only matches *.ts/tsx,
            // so they must be explicitly repeated here for <script lang="ts"> blocks.
            ...tsRules,

            // svelte/indent handles indentation inside .svelte files - disable the base rule
            indent: "off",

            // Allow console in Svelte files
            "no-console": ["error", { allow: ["error", "warn", "debug", "info"] }],

            // Svelte-specific rules
            "svelte/no-unused-svelte-ignore": "warn",
            "svelte/no-useless-mustaches": "warn",
            "svelte/no-extra-reactive-curlies": "warn",
            "svelte/no-reactive-reassign": "error",
            "svelte/no-dom-manipulating": "warn",
            "svelte/require-optimized-style-attribute": "warn",
            "svelte/prefer-class-directive": "warn",
            "svelte/prefer-style-directive": "warn",
            "svelte/shorthand-attribute": "warn",
            "svelte/shorthand-directive": "warn",
            "svelte/html-closing-bracket-new-line": "error",
            "svelte/html-self-closing": ["warn", {
                void: "always",
                normal: "never",
                svg: "always",
                math: "always",
                component: "always",
                svelte: "always"
            }],
            "svelte/indent": ["warn", {
                indent: 4,
                switchCase: 1
            }],
            "svelte/max-attributes-per-line": ["error", {
                multiline: 1,
                singleline: 3
            }],
            "svelte/first-attribute-linebreak": ["error", {
                multiline: "below",
                singleline: "beside"
            }],
            "svelte/mustache-spacing": "warn",
            "svelte/no-spaces-around-equal-signs-in-attribute": "error",

            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-explicit-any": "off"
        }
    }
];
