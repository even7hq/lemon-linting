module.exports = {
    root: true,

    extends: [
        require.resolve("@vue/eslint-config-typescript")
    ],

    rules: {
        "@typescript-eslint/quotes": ["error", "double", {
            avoidEscape: false,
            allowTemplateLiterals: true
        }],

        "no-console": "warn",

        "@typescript-eslint/keyword-spacing": ["warn", {
            before: true,

            overrides: {
                catch: {
                    after: false
                }
            }
        }],

        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-explicit-any": "off",
    }
};