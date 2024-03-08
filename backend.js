module.exports = {
    extends: [
        require.resolve("./typescript"),
    ],

    rules: {
        // Since in backend we don't use .js files, we're re-enabling this here
        "@typescript-eslint/keyword-spacing": ["warn", {
            before: true,
            after: true
        }]
    }
};