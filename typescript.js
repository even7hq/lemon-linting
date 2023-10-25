module.exports = {
    root: true,

    extends: [
        require.resolve("@vue/eslint-config-typescript")
    ],

    rules: {
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