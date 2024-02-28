module.exports = {
    extends: [
        "plugin:@typescript-eslint/recommended"
    ],

    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],

    rules: {
        // Allow explicit any
        "@typescript-eslint/no-explicit-any": "off",

        // Allow TS comments
        "@typescript-eslint/ban-ts-comment": "off"
    }
}