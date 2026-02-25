module.exports = {
    root: true,

    env: {
        node: true
    },

    extends: [
        require.resolve("./common"),
        require.resolve("@vue/eslint-config-typescript"),

        "plugin:vue/essential",
        "plugin:vue/recommended"
    ],

    plugins: [
        "vue"
    ],

    parserOptions: {
        parser: {
            ts: require.resolve("@typescript-eslint/parser"),
            js: "espree",

            // Skip parsing for server-side Lua blocks (<script server lang="lua">)
            lua: require.resolve("./parsers/noop-parser")
        }
    },

    rules: {
        // Allow console
        "no-console": ["error", {
            allow: ["error", "warn", "debug", "info"]
        }],

        // Disable some unused rules
        "vue/multi-word-component-names": "off",
        "vue/require-default-prop": "off",
        "vue/attribute-hyphenation": "off",
        "vue/html-self-closing": "off",

        "vue/singleline-html-element-content-newline": "warn",
        "vue/new-line-between-multi-line-property": "warn",
        "vue/multiline-html-element-content-newline": "warn",

        "vue/component-definition-name-casing": ["error", "PascalCase"],
        "vue/html-closing-bracket-newline": "error",
        "vue/first-attribute-linebreak": ["error", {
            singleline: "ignore",
            multiline: "below"
        }],

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

        // Enforce the script indent
        "vue/script-indent": ["warn", 4, {
            switchCase: 1,
            ignores: [
                // Ignore if statements with alternates
                "IfStatement[alternate]"
            ]
        }],

        "vue/valid-v-on": ["error", {
            // @click.away
            modifiers: ["away"]
        }],

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
                "el",
                "name",
                "key",
                "parent",
                "functional",
                ["delimiters", "comments"],
                ["components", "directives", "filters"],
                "extends",
                "mixins",
                ["provide", "inject"],
                "ROUTER_GUARDS",
                "layout",
                "middleware",
                "validate",
                "scrollToTop",
                "transition",
                "loading",
                "inheritAttrs",
                "model",
                ["props", "propsData"],
                "emits",
                "slots",
                "expose",
                "setup",
                "asyncData",
                "data",
                "fetch",
                "head",
                "computed",
                "watch",
                "watchQuery",
                "methods",
                "LIFECYCLE_HOOKS",
                ["template", "render"],
                "renderError"
            ]
        }],

        // Enforce the component tags order
        "vue/component-tags-order": ["error", {
            order: [
                "script([setup])",
                "style",
                "template",
                "script:not([setup])"
            ]
        }],

        "vue/html-quotes": "error",

        "vue/html-indent": ["error", 4, {
            "attribute": 1,
            "baseIndent": 1,
            "closeBracket": 0,
            "alignAttributesVertically": true,
            "ignores": []
        }],

        "vue/max-attributes-per-line": ["error", {
            singleline: { max: 3 },
            multiline: { max: 1 }
        }],

        // v-html will throw an error
        "vue/no-v-html": "error",

        // Enforce the true attribute shorthand
        "vue/prefer-true-attribute-shorthand": "warn",

        // Enforce the first attribute to be on the same line
        "vue/first-attribute-linebreak": ["error"],

        // Deny duplicate attribute inheritance
        "vue/no-duplicate-attr-inheritance": "error",

        // Deny async in computed properties
        "vue/no-async-in-computed-properties": "error",

        // Deny useless concatenation
        "vue/no-useless-concat": "error",

        // Enforce the block language (ts for standard scripts, lua for server scripts via ts2lua)
        "vue/block-lang": ["error", {
            script: {
                lang: ["ts", "lua"]
            }
        }],

        /**
         * Docs
         */

        // Enforce prop comments
        "vue/require-prop-comment": ["warn"],
        "vue/require-typed-object-prop": ["warn"],

        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-explicit-any": "off",
    }
};