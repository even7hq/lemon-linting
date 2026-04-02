module.exports = {
    extends: [
        require.resolve("./common"),
        require.resolve("./typescript")
    ],

    plugins: ["local"],

    rules: {
        // Prevents invalid sanitization RegExp
        //"local/prevent-invalid-sanitization-regexp": "error",

        // Prefer `} else\nif` over `} else if` for chained conditionals
        "local/prefer-else-newline-if": "warn",

        // Require @param and @returns on documented functions and methods
        "local/require-jsdoc-param-returns": "warn",

        // Since in backend we don't use .js files, we're re-enabling this here
        "keyword-spacing": ["warn", {
            before: true,
            after: true
        }]
    }
};