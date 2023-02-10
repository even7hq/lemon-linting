import vue from "eslint-plugin-vue";

module.exports = [
    {
        env: {
            browser: true,
            es2015: true,
            es2021: false
        },
        extends: "eslint:recommended",
        parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module"
        }
    },
    {
        files: ["src/**/*.vue"],
        plugins: {
            vue: vue
        },
        rules: {
            "vue/html-quotes": "error",
            "vue/component-definition-name-casing": ["error", "PascalCase"],
            "vue/html-self-closing": "warn",
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
            "vue/padding-line-between-tags": "warn",
            "vue/padding-lines-in-component-definition": "warn",
            "vue/prefer-separate-static-class": "error",
            "vue/prefer-true-attribute-shorthand": "warn",

            "vue/script-indent": ["warn", 4],

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
            }]
        }
    }
];