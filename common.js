require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
    root: true,

    env: {
        browser: true,
        es2015: true,
        es2021: false
    },

    extends: [
        "eslint:recommended",
        "plugin:import/recommended"
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

        // Disable no-undef because it conflicts with the default language server
        "no-undef": "off",
        
        // Block async promise executor, because
        // they can lead to unfortunate side effects
        "no-async-promise-executor": "error",

        // Objects with 3+ properties must have newlines (opening and closing braces)
        "object-curly-newline": ["warn", {
            "ObjectExpression": {
                multiline: true,
                minProperties: 3
            }
        }],

        // Each property must be on its own line when the object spans multiple lines
        "object-property-newline": ["warn", {
            allowAllPropertiesOnSameLine: false
        }],

        // No trailing commas
        "comma-dangle": ["warn", "never"],

        // No extra semicolons
        "no-extra-semi": "error",

        // No trailing spaces
        "no-trailing-spaces": ["warn", {
            "ignoreComments": true
        }],

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
        "no-extra-boolean-cast": "off",

        // Conflicts with namespaces
        "no-inner-declarations": "off",

        // Import order
        "import/order": [
            "warn",
            {
                groups: ["builtin", "external", "internal", "parent", "sibling"],
                alphabetize: { order: "asc" }
            }
        ]
    }
};