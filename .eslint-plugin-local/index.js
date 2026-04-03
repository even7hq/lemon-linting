module.exports = {
    meta: {
        name: "eslint-plugin-lemon-rules",
        version: "1.0.0"
    },

    rules: {
        "prevent-invalid-sanitization-regexp": require("./misc/prevent-invalid-sanitization-regexp"),
        "prefer-else-newline-if": require("./misc/prefer-else-newline-if"),
        "require-jsdoc-param-returns": require("./misc/require-jsdoc-param-returns"),
        "require-blank-line-between-documented-props": require("./misc/require-blank-line-between-documented-props"),
        "require-multiline-jsdoc": require("./misc/require-multiline-jsdoc"),
        "jsx-newline-before-block-expression": require("./misc/jsx-newline-before-block-expression"),
        "jsx-newline-between-elements-with-children": require("./misc/jsx-newline-between-elements-with-children")
    }
}