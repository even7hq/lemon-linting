module.exports = {
    extends: [
        require.resolve("./common"),
        require.resolve("./typescript")
    ],

    /*plugins: [
        require.resolve("./.eslint-plugin-local")
    ],*/

    rules: {
        // Prevents invalid sanitization RegExp
        //"local/prevent-invalid-sanitization-regexp": "error",

        // Since in backend we don't use .js files, we're re-enabling this here
        "keyword-spacing": ["warn", {
            before: true,
            after: true
        }]
    }
};