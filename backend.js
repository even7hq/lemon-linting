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

        // Require blank line between interface/type properties when any has a JSDoc block
        "local/require-blank-line-between-documented-props": "warn",

        // Require JSDoc comments to use multiline format
        "local/require-multiline-jsdoc": "warn",

        // Require multiline JSDoc on UPPER_CASE const declarations
        "local/require-jsdoc-on-upper-case-const": "warn",

        // Convert standalone // comments before declarations into /** */ docblocks
        "local/prefer-jsdoc-comment": "warn",

        // Require blank line before a property that follows a closing } or )
        "local/blank-line-after-block-prop": "warn",

        // Disallow await import() with static paths unless justified with a @tag comment
        "local/no-await-import": "warn",

        // Since in backend we don't use .js files, we're re-enabling this here
        "keyword-spacing": ["warn", {
            before: true,
            after: true
        }]
    }
};