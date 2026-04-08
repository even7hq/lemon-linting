const commonConfig = require("./common.config");
const { localPlugin, localRules } = require("./common.config");
const typescriptConfig = require("./typescript.config");
const vuePlugin = require("eslint-plugin-vue");
const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");
const noopParser = require("./parsers/noop-parser");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
    ...commonConfig,
    ...typescriptConfig,

    // vue-eslint-parser as the main parser, with ts/lua sub-parsers
    ...vuePlugin.configs["flat/recommended"],

    {
        files: ["**/*.vue"],

        // Re-register the local plugin here because vue-eslint-parser creates its own
        // config context for .vue files, where plugins from common.config are not inherited.
        plugins: {
            local: localPlugin
        },

        languageOptions: {
            globals: {
                ...globals.node
            },
            parserOptions: {
                parser: {
                    ts: tsParser,
                    js: "espree",
                    // Skip parsing for server-side Lua blocks (<script server lang="lua">)
                    lua: noopParser
                }
            }
        },

        rules: {
            // Re-apply all local/* rules so they work inside Vue <script> blocks
            ...localRules,

            // Allow console in Vue files
            "no-console": ["error", { allow: ["error", "warn", "debug", "info"] }],

            "vue/multi-word-component-names": "off",
            "vue/require-default-prop": "off",
            "vue/attribute-hyphenation": "off",
            "vue/html-self-closing": "off",
            "vue/v-on-event-hyphenation": "off",

            "vue/singleline-html-element-content-newline": "warn",
            "vue/new-line-between-multi-line-property": "warn",
            "vue/multiline-html-element-content-newline": "warn",

            "vue/component-definition-name-casing": ["error", "PascalCase"],
            "vue/html-closing-bracket-newline": "error",
            "vue/first-attribute-linebreak": ["error", { singleline: "ignore", multiline: "below" }],
            "vue/html-closing-bracket-spacing": "error",
            "vue/html-end-tags": "error",
            "vue/no-multi-spaces": "error",
            "vue/mustache-interpolation-spacing": "warn",
            "vue/no-spaces-around-equal-signs-in-attribute": "error",
            "vue/no-template-shadow": "error",
            "vue/prop-name-casing": ["warn", "camelCase"],
            "vue/padding-line-between-blocks": "error",
            "vue/padding-lines-in-component-definition": "warn",
            "vue/prefer-separate-static-class": "error",
            "vue/prefer-true-attribute-shorthand": "warn",

            "vue/script-indent": ["warn", 4, {
                switchCase: 1,
                ignores: ["IfStatement[alternate]"]
            }],

            "vue/valid-v-on": ["error", { modifiers: ["away"] }],

            "vue/padding-line-between-tags": ["warn", [
                { blankLine: "consistent", prev: "br", next: "*" },
                { blankLine: "consistent", prev: "*", next: "br" },
                { blankLine: "consistent", prev: "span", next: "*" },
                { blankLine: "consistent", prev: "*", next: "span" },
                { blankLine: "never", prev: "*", next: "strong" },
                { blankLine: "never", prev: "em", next: "*" },
                { blankLine: "never", prev: "*", next: "em" }
            ]],

            "vue/v-bind-style": "error",
            "vue/v-on-style": "error",
            "vue/no-lone-template": "error",
            "vue/this-in-template": "error",
            "vue/block-tag-newline": "error",
            "vue/no-empty-component-block": "warn",
            "vue/attributes-order": "warn",
            "vue/no-multiple-objects-in-class": "warn",
            "vue/no-this-in-before-route-enter": "error",

            "vue/order-in-components": ["warn", {
                order: [
                    "el", "name", "key", "parent", "functional",
                    ["delimiters", "comments"],
                    ["components", "directives", "filters"],
                    "extends", "mixins", ["provide", "inject"],
                    "ROUTER_GUARDS", "layout", "middleware", "validate",
                    "scrollToTop", "transition", "loading", "inheritAttrs",
                    "model", ["props", "propsData"], "emits", "slots", "expose",
                    "setup", "asyncData", "data", "fetch", "head", "computed",
                    "watch", "watchQuery", "methods", "LIFECYCLE_HOOKS",
                    ["template", "render"], "renderError"
                ]
            }],

            "vue/component-tags-order": ["error", {
                order: ["script([setup])", "style", "template", "script:not([setup])"]
            }],

            "vue/html-quotes": "error",

            "vue/html-indent": ["error", 4, {
                attribute: 1,
                baseIndent: 1,
                closeBracket: 0,
                alignAttributesVertically: true,
                ignores: []
            }],

            "vue/max-attributes-per-line": ["error", {
                singleline: { max: 3 },
                multiline: { max: 1 }
            }],

            "vue/no-v-html": "error",
            "vue/no-duplicate-attr-inheritance": "error",
            "vue/no-async-in-computed-properties": "error",
            "vue/no-useless-concat": "error",

            "vue/block-lang": ["error", {
                script: { lang: ["ts", "lua"] }
            }],

            "vue/require-prop-comment": ["warn"],
            "vue/require-typed-object-prop": ["warn"],

            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-explicit-any": "off"
        }
    }
];
