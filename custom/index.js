/**
 * @type {import("eslint").ESLint.Plugin}
 */
module.exports = {
    processors: {
        "filter-indent-return-type-close": require("./processors/FilterIndentReturnTypeClose.js").processor
    },

    rules: {
        "blank-line-after-block-prop": require("./blank-line-after-block-prop"),
        "prevent-invalid-sanitization-regexp": require("./prevent-invalid-sanitization-regexp"),
        "jsx-newline-before-block-expression": require("./jsx-newline-before-block-expression"),
        "jsx-newline-between-elements-with-children": require("./jsx-newline-between-elements-with-children"),
        "no-await-import": require("./no-await-import"),
        "prefer-else-newline-if": require("./prefer-else-newline-if"),
        "prefer-jsdoc-comment": require("./prefer-jsdoc-comment"),
        "remove-unused-vars": require("./remove-unused-vars"),
        "require-blank-line-between-documented-props": require("./require-blank-line-between-documented-props"),
        "require-jsdoc-on-upper-case-const": require("./require-jsdoc-on-upper-case-const"),
        "require-jsdoc-param-returns": require("./require-jsdoc-param-returns"),
        "require-multiline-jsdoc": require("./require-multiline-jsdoc"),
        "max-inline-calls": require("./max-inline-calls"),
        "require-blank-lines-around-jsdoc": require("./require-blank-lines-around-jsdoc"),
        "require-jsdoc-throws": require("./require-jsdoc-throws"),
        "no-inline-type-import": require("./no-inline-type-import"),
        "no-jsdoc-tag-format": require("./no-jsdoc-tag-format"),
        "no-em-dash": require("./no-em-dash"),
        "no-reexport-stub": require("./no-reexport-stub"),
        "no-unsafe-type-assertion": require("./no-unsafe-type-assertion"),
        "no-reflect-typing": require("./no-reflect-typing"),
        "no-catch-any": require("./no-catch-any"),
        "no-empty-catch": require("./no-empty-catch"),
        "vue-no-style-block": require("./vue-no-style-block"),
        "no-form-data-consumer": require("./no-form-data-consumer"),
        "no-sql-placeholder-fk": require("./no-sql-placeholder-fk"),
        "pt-br-accents": require("./pt-br-accents")
    }
};
