module.exports = {
    extends: [
        require.resolve("./common"),
        require.resolve("./typescript")
    ],

    plugins: ["local"],

    rules: {
        // Prefer `} else\nif` over `} else if` for chained conditionals
        "local/prefer-else-newline-if": "warn",

        // Require @param and @returns on documented functions and methods
        "local/require-jsdoc-param-returns": "warn",

        // Require blank line between interface/type properties when any has a JSDoc block
        "local/require-blank-line-between-documented-props": "warn",

        // Require JSDoc comments to use multiline format
        "local/require-multiline-jsdoc": "warn",

        // Require a blank JSX line before conditional (&&) and map expressions
        "local/jsx-newline-before-block-expression": "warn",

        // Require a blank JSX line between sibling elements that have children
        "local/jsx-newline-between-elements-with-children": "warn"
    }
};