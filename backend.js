module.exports = {
    extends: [
        require.resolve("./common"),
        require.resolve("./typescript")
    ],

    rules: {
        // Prevents invalid sanitization RegExp
        //"local/prevent-invalid-sanitization-regexp": "error",

        // Prefer `} else\nif` over `} else if` for chained conditionals
        "local/prefer-else-newline-if": "warn",

        // Require @param and @returns on documented functions and methods
        "local/require-jsdoc-param-returns": "warn",

        // Require blank line between interface/type properties when any has a JSDoc block
        "local/require-blank-line-between-documented-props": "warn",

        // Require JSDoc comments to use multiline format
        "local/require-multiline-jsdoc": "warn",

        // Since in backend we don't use .js files, we're re-enabling this here
        "keyword-spacing": ["warn", {
            before: true,
            after: true
        }]
    }
};