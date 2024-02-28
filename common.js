require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
    root: true,

    env: {
        browser: true,
        es2015: true,
        es2021: false
    },

    extends: [
        "eslint:recommended"
    ],

    parserOptions: {
        sourceType: "module"
    },

    rules: {
        // Only double quotes
        quotes: ["warn", "double"],

        // Allow only console.debug
        "no-console": ["error", {
            allow: ["debug"]
        }],

        // Objects need to have a newline
        "object-curly-newline": ["warn", {
            "ObjectExpression": {
                multiline: true,
                consistent: true,
                minProperties: 3
            }
        }],

        // Object properties needs in a newline
        "object-property-newline": ["warn", {
            allowAllPropertiesOnSameLine: true
        }],

        // No trailing commas
        "comma-dangle": ["warn", "never"],

        // No extra semicolons
        "no-extra-semi": "error",

        // No trailing spaces
        "no-trailing-spaces": "warn",

        // Use arrow function callbacks
        "prefer-arrow-callback": "error",

        // Use parentheses in arrow functions
        "arrow-parens": "error",

        // Requires `const` for never-reused variables
        "prefer-const": "error",

        // Enforce `for` loop update moving the counter in the right direction
        "for-direction": "error",

        // Enfore spaces before blocks
        "space-before-blocks": ["error", "always"],

        // Enfore spaces after blocks
        "block-spacing": ["error", "always"],

        // Enfore spaces after keywords
        "keyword-spacing": "error",

        // Allow extra boolean casting
        "no-extra-boolean-cast": "off"
    }
};