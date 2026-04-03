module.exports = {
    extends: [
        require.resolve("./common"),
        require.resolve("./typescript")
    ],

    plugins: ["local"],

    rules: {
        // Require a blank JSX line before conditional (&&) and map expressions
        "local/jsx-newline-before-block-expression": "warn",

        // Require a blank JSX line between sibling elements that have children
        "local/jsx-newline-between-elements-with-children": "warn"
    }
};