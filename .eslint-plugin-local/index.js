module.exports = {
    meta: {
        name: "eslint-plugin-lemon-rules",
        version: "1.0.0"
    },

    rules: {
        "prevent-invalid-sanitization-regexp": require("./misc/prevent-invalid-sanitization-regexp")
    }
}