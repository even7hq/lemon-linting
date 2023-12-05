require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
    root: true,

    env: {
        node: true
    },

    extends: [
        require.resolve("./common"),
        require.resolve("./typescript"),

        "plugin:vue/essential",
        "plugin:vue/recommended"
    ],

    plugins: [
        "vue"
    ],

    rules: {
        // Disable some unused rules
        "vue/multi-word-component-names": "off",
        "vue/require-default-prop": "off",
        "vue/attribute-hyphenation": "off",
        "vue/attribute-hyphenation": "off",

        "vue/singleline-html-element-content-newline": "warn",
        "vue/multiline-html-element-content-newline": "warn",

        "vue/html-self-closing": ["warn", {
            "i": "any"
        }],

        "vue/html-quotes": "error",
        "vue/component-definition-name-casing": ["error", "PascalCase"],
        "vue/html-self-closing": "off",
        "vue/html-closing-bracket-newline": "error",
        "vue/first-attribute-linebreak": "error",
        "vue/html-closing-bracket-spacing": "error",
        "vue/html-end-tags": "error",
        "vue/multiline-html-element-content-newline": "error",
        "vue/no-multi-spaces": "error",
        "vue/mustache-interpolation-spacing": "warn",
        "vue/no-spaces-around-equal-signs-in-attribute": "error",
        "vue/no-template-shadow": "error",
        "vue/prop-name-casing": ["warn", "camelCase"],
        "vue/singleline-html-element-content-newline": "error",
        "vue/padding-line-between-blocks": "error",
        "vue/padding-lines-in-component-definition": "warn",
        "vue/prefer-separate-static-class": "error",
        "vue/prefer-true-attribute-shorthand": "warn",

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

            { blankLine: "never", prev: "strong", next: "*" },
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
            singleline: {
                max: 3
            },

            multiline: {
                max: 1
            }
        }],

        "no-console": false,
    }
};